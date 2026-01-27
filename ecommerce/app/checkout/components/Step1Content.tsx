"use client";

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Truck, MapPin, User, Phone, Mail, Lock, Home, FileText, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiService } from '@/app/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';

// Validation schema
const formSchema = z.object({
  firstName: z.string().min(1, 'Нэр оруулна уу'),
  lastName: z.string().min(1, 'Овог оруулна уу'),
  phone: z.string().regex(/^\d{8}$/, 'Утасны дугаар 8 оронтой байх ёстой'),
  email: z.string().email('Имэйл хаяг буруу байна').optional().or(z.literal('')),
  city: z.string().min(1, 'Хот сонгоно уу'),
  district: z.string().optional(),
  khoroo: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
  deliveryMethod: z.enum(['delivery', 'pickup', 'invoice']),
}).refine((data) => {
  if (data.deliveryMethod === 'delivery') {
    // Check if address exists and has at least 3 characters after trimming
    const addressValue = data.address;
    if (!addressValue || typeof addressValue !== 'string') {
      return false;
    }
    const trimmedAddress = addressValue.trim();
    // Count actual characters (not bytes) - this handles Unicode correctly
    return trimmedAddress.length >= 3;
  }
  return true;
}, {
  message: 'Дэлгэрэнгүй хаягаа оруулна уу. Хамгийн багадаа 3 тэмдэгт',
  path: ['address'],
});

interface Step1ContentProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleProceedToPayment: (data: any) => Promise<void>;
  handleCreateInvoice: (e?: React.MouseEvent, formDataOverride?: any) => Promise<void>;
  handleDeliveryMethodChange: (deliveryMethod: string, addressFields?: { city?: string; district?: string; khoroo?: string; address?: string }) => void;
  isAuthenticated: boolean;
  subtotal: number;
  total: number;
  isCreatingInvoice: boolean;
  isProcessing: boolean;
  formatPrice: (price: number) => string;
}

interface SavedAddress {
  id: string;
  city: string;
  district?: string;
  khoroo?: string;
  address: string;
  is_default?: boolean;
}

const Step1Content = ({
  formData,
  handleProceedToPayment,
  handleCreateInvoice,
  handleDeliveryMethodChange,
  isAuthenticated,
  subtotal,
  total,
  isCreatingInvoice,
  isProcessing,
  formatPrice
}: Step1ContentProps) => {
  const router = useRouter();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const prevFormDataRef = useRef(formData);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      phone: formData.phone || '',
      email: formData.email || '',
      city: formData.city || 'Улаанбаатар',
      district: formData.district || '',
      khoroo: formData.khoroo || '',
      address: formData.address || '',
      note: formData.note || '',
      deliveryMethod: formData.deliveryMethod || 'delivery',
    },
  });

  // Watch deliveryMethod to conditionally show address fields
  const deliveryMethod = form.watch('deliveryMethod');
  const city = form.watch('city');

  // Fetch saved addresses for authenticated users (always fetch, regardless of delivery method)
  useEffect(() => {
    if (isAuthenticated) {
      const fetchAddresses = async () => {
        try {
          setLoadingAddresses(true);
          const response = await apiService.getUserAddresses();
          if (response.success && response.addresses) {
            setSavedAddresses(response.addresses);
            // If there's a default address and no address is filled yet, pre-fill the form
            const defaultAddress = response.addresses.find((addr: SavedAddress) => addr.is_default);
            if (defaultAddress && !formData.address && deliveryMethod === 'delivery') {
              form.setValue('city', defaultAddress.city);
              form.setValue('district', defaultAddress.district || '');
              form.setValue('khoroo', defaultAddress.khoroo || '');
              form.setValue('address', defaultAddress.address);
            }
          }
        } catch (error) {
          console.error('Failed to fetch addresses:', error);
        } finally {
          setLoadingAddresses(false);
        }
      };
      fetchAddresses();
    } else {
      // Clear saved addresses if user is not authenticated
      setSavedAddresses([]);
    }
  }, [isAuthenticated, form, formData.address, deliveryMethod]);

  // Sync formData from parent when it changes, but preserve current form values
  useEffect(() => {
    const currentFormValues = form.getValues();
    const prevFormData = prevFormDataRef.current;
    
    // Check if only deliveryMethod changed
    const onlyDeliveryMethodChanged = 
      prevFormData.deliveryMethod !== formData.deliveryMethod &&
      prevFormData.firstName === formData.firstName &&
      prevFormData.lastName === formData.lastName &&
      prevFormData.phone === formData.phone &&
      prevFormData.email === formData.email &&
      prevFormData.city === formData.city &&
      prevFormData.district === formData.district &&
      prevFormData.khoroo === formData.khoroo &&
      prevFormData.address === formData.address &&
      prevFormData.note === formData.note;
    
    if (onlyDeliveryMethodChanged) {
      // Only update deliveryMethod, preserve all other current form values
      form.setValue('deliveryMethod', formData.deliveryMethod || 'delivery');
    } else {
      // Full reset, but preserve current form values for fields that parent doesn't have
      form.reset({
        firstName: formData.firstName !== undefined && formData.firstName !== '' ? formData.firstName : currentFormValues.firstName || '',
        lastName: formData.lastName !== undefined && formData.lastName !== '' ? formData.lastName : currentFormValues.lastName || '',
        phone: formData.phone !== undefined && formData.phone !== '' ? formData.phone : currentFormValues.phone || '',
        email: formData.email !== undefined && formData.email !== '' ? formData.email : currentFormValues.email || '',
        city: formData.city !== undefined && formData.city !== '' ? formData.city : currentFormValues.city || 'Улаанбаатар',
        district: formData.district !== undefined ? formData.district : currentFormValues.district || '',
        khoroo: formData.khoroo !== undefined ? formData.khoroo : currentFormValues.khoroo || '',
        address: formData.address !== undefined ? formData.address : currentFormValues.address || '',
        note: formData.note !== undefined ? formData.note : currentFormValues.note || '',
        deliveryMethod: formData.deliveryMethod || currentFormValues.deliveryMethod || 'delivery',
      });
    }
    
    prevFormDataRef.current = formData;
  }, [formData, form]);

  // Handle selecting a saved address
  const handleSelectAddress = useCallback((address: SavedAddress) => {
    form.setValue('city', address.city);
    form.setValue('district', address.district || '');
    form.setValue('khoroo', address.khoroo || '');
    form.setValue('address', address.address);
  }, [form]);

  const handleLoginRedirect = useCallback(() => {
    router.push('/?login_required=true&redirect=/checkout');
  }, [router]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await handleProceedToPayment(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* User Authentication Notice */}
        {!isAuthenticated && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-1">Нэвтэрсэн хэрэглэгчдэд</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Нэвтэрч орсноор захиалгын түүхийг хадгалах, дараагийн удаа бөглөх шаардлагагүй болно.
                  </p>
                  <Button
                    type="button"
                    onClick={handleLoginRedirect}
                    variant="blue"
                    size="sm"
                  >
                    Нэвтрэх / Бүртгүүлэх
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Холбоо барих мэдээлэл
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Нэр *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Овог *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Утасны дугаар *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input {...field} type="tel" placeholder="88888888" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имэйл хаяг</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input {...field} type="email" placeholder="name@example.com" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address - Hide for pickup */}
        {deliveryMethod !== 'pickup' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {deliveryMethod === 'delivery' ? 'Хүргэлтийн хаяг' : 'Хаяг'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Saved Addresses Section - Show for authenticated users with saved addresses */}
                {isAuthenticated && (
                  <>
                    {loadingAddresses ? (
                      <div className="text-sm text-gray-500 mb-4">Хаягуудыг ачааллаж байна...</div>
                    ) : savedAddresses.length > 0 ? (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <Label className="text-sm font-semibold mb-3 block text-blue-900">
                          📍 Өмнө ашигласан хаягууд
                        </Label>
                        <div className="space-y-2">
                          {savedAddresses.map((savedAddr) => (
                            <button
                              key={savedAddr.id}
                              type="button"
                              onClick={() => handleSelectAddress(savedAddr)}
                              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-white transition-colors flex items-start gap-3 group bg-white"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {savedAddr.city}
                                    {savedAddr.district && `, ${savedAddr.district}`}
                                    {savedAddr.khoroo && `, ${savedAddr.khoroo}`}
                                  </span>
                                  {savedAddr.is_default && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Үндсэн</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">{savedAddr.address}</div>
                              </div>
                              <Check className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-gray-600">
                          💡 Дээрх хаягуудын аль нэгийг сонгох эсвэл доор шинэ хаяг оруулна уу
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Хот *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Хот сонгох" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Улаанбаатар">Улаанбаатар</SelectItem>
                          <SelectItem value="Дархан">Дархан</SelectItem>
                          <SelectItem value="Эрдэнэт">Эрдэнэт</SelectItem>
                          <SelectItem value="бусад">Бусад</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {city === 'Улаанбаатар' ? (
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дүүрэг</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Дүүрэг сонгох" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Баянзүрх">Баянзүрх</SelectItem>
                              <SelectItem value="Сонгинохайрхан">Сонгинохайрхан</SelectItem>
                              <SelectItem value="Хан-Уул">Хан-Уул</SelectItem>
                              <SelectItem value="Баянгол">Баянгол</SelectItem>
                              <SelectItem value="Сүхбаатар">Сүхбаатар</SelectItem>
                              <SelectItem value="Чингэлтэй">Чингэлтэй</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дүүрэг</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Дүүрэг" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="khoroo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Хороо</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="15-р хороо" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дэлгэрэнгүй хаяг *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input {...field} placeholder="Байр, орц, давхар, тоот" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Хүргэлтийн арга
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="deliveryMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Get current form values to preserve address fields
                        const currentFormValues = form.getValues();
                        // Update parent state with delivery method AND current address fields
                        handleDeliveryMethodChange(value, {
                          city: currentFormValues.city,
                          district: currentFormValues.district,
                          khoroo: currentFormValues.khoroo,
                          address: currentFormValues.address,
                        });
                      }}
                      value={field.value}
                      className="flex flex-col space-y-3"
                    >
                      <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="delivery" id="delivery" className="mt-1" />
                        <div className="flex-1">
                          <div className="font-medium">Хүргэлтээр</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {subtotal > 120000 ? 'Үнэгүй' : `${formatPrice(5000)}`} - 2-3 хоногт
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Таны зааж өгсөн хаягт хүргэж өгнө
                          </div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
                        <div className="flex-1">
                          <div className="font-medium">Ирж авах</div>
                          <div className="text-sm text-gray-600 mt-1">Үнэгүй - Одоо авах боломжтой</div>
                          <div className="text-xs text-gray-500 mt-2">
                            Улаанбаатар хот, Сонгинохайрхан дүүрэг, 1018shop дэлгүүр
                          </div>
                        </div>
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Тэмдэглэл</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тайлбар, зөвлөмж, хүргэлтийн заавар...</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Тайлбар, зөвлөмж, хүргэлтийн заавар..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            asChild
          >
            <Link href="/cart">
              <ArrowLeft className="w-4 h-4" />
              Сагс руу буцах
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              onClick={(e) => {
                const currentFormValues = form.getValues();
                handleCreateInvoice(e, currentFormValues);
              }}
              disabled={isCreatingInvoice}
              variant="blue"
            >
              <FileText className="w-4 h-4" />
              {isCreatingInvoice ? 'Нэхэмжлэх үүсгэж байна...' : `Нэхэмжлэх авах - ${formatPrice(subtotal)}`}
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              variant="gradient"
            >
              <CreditCard className="w-4 h-4" />
              Төлбөр төлөх - {formatPrice(total)}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default Step1Content;

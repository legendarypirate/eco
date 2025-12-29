"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Lock, User, Eye, EyeOff, Shield, Users, Database, ChevronRight, Phone, Key } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
  };

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.phone.trim()) {
      setError("Утасны дугаар оруулна уу");
      return;
    }
    
    if (!formData.password) {
      setError("Нууц үг оруулна уу");
      return;
    }

    if (formData.phone.length !== 8) {
      setError("Утасны дугаар 8 оронтой байх ёстой");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use environment variable or fallback to localhost:3001
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          password: formData.password
        }),
      });

      // Check if response is ok before parsing JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Серверийн хариу буруу байна');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Нэвтрэхэд алдаа гарлаа');
      }

      // Login successful
      setSuccess(true);
      
      // Store token if provided
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect after successful login
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1000);

    } catch (err: any) {
      // Handle network errors
      if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
        setError('Сервертэй холбогдох боломжгүй байна. Сервер ажиллаж байгаа эсэхийг шалгана уу.');
      } else {
        setError(err.message || 'Сервертэй холбогдоход алдаа гарлаа');
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Left Side - Brand/Info Section */}
      <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-between bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Системд нэвтрэх
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Албаны нэгдсэн систем
            </p>
          </div>
        </div>

        <div className="max-w-lg mt-16">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Тавтай морилно уу{" "}
            <span className="text-green-600 dark:text-green-400">
              Нэгдсэн Системд
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-4 text-base leading-relaxed">
            Та утасны дугаар, нууц үгээ ашиглан системд нэвтэрч албан үйлчилгээ, төслийн мэдээлэл, багийн ажиллагааг удирдана.
          </p>
          
          <div className="mt-12 space-y-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Хэрэглэгчийн удирдлага</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Хэрэглэгчийн эрх, үүргийн нарийн тохиргоо
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3">
                <Database className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Аюулгүй байдал</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Өндөр түвшний нууцлал, мэдээллийн аюулгүй байдал
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Нэгдсэн систем</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Бүх албаны нэгдсэн мэдээллийн сан
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Нэгдсэн Систем. Бүх эрх хуулиар хамгаалагдсан.</p>
          <p className="mt-1 text-xs">Холбогдох утас: 7011-2233</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Системд нэвтрэх</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Утасны дугаар, нууц үгээ оруулна уу</p>
          </div>

          <Card className="border border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold text-center text-gray-900 dark:text-white">
                Нэвтрэх форм
              </CardTitle>
              <CardDescription className="text-center text-gray-600 dark:text-gray-400">
                Та өөрийн бүртгэлтэй утасны дугаар, нууц үгээ оруулна уу
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-6 p-8">
                {/* Success Message */}
                {success && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                        <Key className="h-3 w-3" />
                      </div>
                      <span className="font-medium">Амжилттай нэвтэрлээ! Чиглүүлэлт хийж байна...</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <div className="h-5 w-5 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center">
                        <Shield className="h-3 w-3" />
                      </div>
                      <span className="font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* Phone Field */}
                <div className="space-y-3 group">
                  <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 font-medium">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 group-focus-within:text-green-600 transition-colors" />
                      Утасны дугаар
                    </div>
                  </Label>
                  <div className="relative">
                    <Input 
                      id="phone" 
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Утасны дугаараа оруулна уу" 
                      className="h-12 pl-10 border-gray-300 dark:border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 rounded-lg"
                      disabled={isLoading}
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                    Жишээ: 99112233, 99999999
                  </p>
                </div>
                
                {/* Password Field */}
                <div className="space-y-3 group">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 group-focus-within:text-green-600 transition-colors" />
                        Нууц үг
                      </div>
                    </Label>
                    <Button 
                      type="button"
                      variant="link" 
                      className="h-auto p-0 text-green-600 dark:text-green-400 hover:text-green-800 text-sm font-medium hover:underline transition-all disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Нууц үгээ мартсан уу?
                    </Button>
                  </div>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Нууц үгээ оруулна уу" 
                      className="h-12 pl-10 pr-12 border-gray-300 dark:border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 rounded-lg"
                      disabled={isLoading}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700 hover:bg-transparent disabled:opacity-50"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pl-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      8-с дээш тэмдэгт, тоо, тусгай тэмдэгт
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-1 bg-gray-300 rounded-full"></div>
                      <div className="w-6 h-1 bg-gray-300 rounded-full"></div>
                      <div className="w-6 h-1 bg-gray-300 rounded-full"></div>
                      <div className="w-6 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Checkboxes Section */}
                <div className="flex items-center justify-between pt-2 px-1">
                  <div className="flex items-center space-x-2 group/remember">
                    <div className="relative">
                      <Checkbox 
                        id="remember" 
                        className="h-5 w-5 border-gray-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 transition-all hover:border-green-500 disabled:opacity-50"
                        disabled={isLoading}
                      />
                      <div className="absolute inset-0 rounded-full bg-green-100 opacity-0 group-hover/remember:opacity-50 transition-opacity -z-10"></div>
                    </div>
                    <Label 
                      htmlFor="remember" 
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none hover:text-green-600 transition-colors disabled:opacity-50"
                    >
                      Намайг сана
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 group/secure">
                    <div className="relative">
                      <Checkbox 
                        id="secure" 
                        className="h-5 w-5 border-gray-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 transition-all hover:border-green-500 disabled:opacity-50"
                        disabled={isLoading}
                      />
                      <div className="absolute inset-0 rounded-full bg-green-100 opacity-0 group-hover/secure:opacity-50 transition-opacity -z-10"></div>
                    </div>
                    <Label 
                      htmlFor="secure" 
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none hover:text-green-600 transition-colors disabled:opacity-50"
                    >
                      Аюулгүй нэвтрэх
                    </Label>
                  </div>
                </div>
                
                {/* Login Button */}
                <div className="pt-4">
                  <Button 
                    type="submit"
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-semibold">Нэвтэрч байна...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <div className="relative">
                          <Lock className="h-5 w-5" />
                          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
                        </div>
                        <span className="font-semibold">Системд нэвтрэх</span>
                      </div>
                    )}
                  </Button>
                  
                  {/* Loading Animation */}
                  <div className="mt-2 flex justify-center">
                    <div className={`w-24 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0'}`}></div>
                  </div>
                </div>

              </CardContent>
            </form>
            
            <CardFooter className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="text-center w-full">
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Тусламж хэрэгтэй бол{" "}
                  <Link href="/help" className="text-green-600 dark:text-green-400 hover:text-green-800 disabled:opacity-50">
                    тусламжийн төвтэй
                  </Link>{" "}
                  холбогдоно уу
                </p>
              </div>
            </CardFooter>
          </Card>
          
          <div className="mt-8 text-center space-y-3">
            <div className="flex items-center justify-center gap-4 text-sm">
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 disabled:opacity-50">
                Үйлчилгээний нөхцөл
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 disabled:opacity-50">
                Нууцлалын бодлого
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 disabled:opacity-50">
                Тусламж
              </Link>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>Албаны системд зөвхөн зөвшөөрөлтэй хэрэглэгчид нэвтрэх боломжтой</p>
              <p className="mt-1">Хандах эрх авахын тулд системийн администратортой холбогдоно уу</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
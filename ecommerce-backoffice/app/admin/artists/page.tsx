"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, Search, Filter, Edit, Trash2, Loader2, Image as ImageIcon, X, MessageSquare, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// API base URL
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/artists`;
const REVIEW_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/artist-reviews`;

// Artist type based on your API
export interface ArtistData {
  id: string;
  name: string;
  nameMn: string;
  image: string | null;
  bio: string | null;
  bioMn: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  location?: string | null;
  category?: string | null;
  title?: string | null;
  productsCount?: number;
  yearsExperience?: number;
  happyCustomers?: number;
  createdAt: string;
  updatedAt: string;
}

// Artist Review type
export interface ArtistReviewData {
  id: string;
  artistId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string | null;
  comment: string;
  helpfulCount: number;
  images: string[];
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  artist?: ArtistData;
  user?: any;
}

// Artist Form Component
function ArtistForm({
  artist,
  onSubmit,
  onCancel,
  isLoading
}: {
  artist?: ArtistData;
  onSubmit: (artistData: Omit<ArtistData, "id" | "createdAt" | "updatedAt"> & { imageFile?: File }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<Omit<ArtistData, "id" | "createdAt" | "updatedAt"> & { imageFile?: File }>({
    name: artist?.nameMn || artist?.name || "",
    nameMn: artist?.nameMn || artist?.name || "",
    image: artist?.image || null,
    bio: artist?.bioMn || artist?.bio || "",
    bioMn: artist?.bioMn || artist?.bio || "",
    phone: artist?.phone || "",
    email: artist?.email || "",
    isActive: artist?.isActive ?? true,
    location: artist?.location || "",
    category: artist?.category || "",
    title: artist?.title || "",
    productsCount: artist?.productsCount || 0,
    yearsExperience: artist?.yearsExperience || 0,
    happyCustomers: artist?.happyCustomers || 0,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(artist?.image || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({...form, imageFile: file});
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setForm({...form, image: null, imageFile: undefined});
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nameMn">Нэр</Label>
          <Input
            id="nameMn"
            value={form.nameMn}
            onChange={(e) => setForm({...form, nameMn: e.target.value, name: e.target.value})}
            placeholder="Урлаачийн нэр"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Утасны дугаар</Label>
          <Input
            id="phone"
            value={form.phone || ""}
            onChange={(e) => setForm({...form, phone: e.target.value})}
            placeholder="99999999"
          />
        </div>

        <div>
          <Label htmlFor="email">Имэйл</Label>
          <Input
            id="email"
            type="email"
            value={form.email || ""}
            onChange={(e) => setForm({...form, email: e.target.value})}
            placeholder="имэйл хаяг"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="bioMn">Товч мэдээлэл</Label>
          <Textarea
            id="bioMn"
            value={form.bioMn || ""}
            onChange={(e) => setForm({...form, bioMn: e.target.value, bio: e.target.value})}
            placeholder="Урлаачийн тухай товч мэдээлэл"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="location">Байршил</Label>
          <Input
            id="location"
            value={form.location || ""}
            onChange={(e) => setForm({...form, location: e.target.value})}
            placeholder="Жишээ: Улаанбаатар, Монгол"
          />
        </div>

        <div>
          <Label htmlFor="category">Ангилал</Label>
          <Input
            id="category"
            value={form.category || ""}
            onChange={(e) => setForm({...form, category: e.target.value})}
            placeholder="Жишээ: Керамик & Ваар"
          />
        </div>

        <div>
          <Label htmlFor="title">Гарчиг</Label>
          <Input
            id="title"
            value={form.title || ""}
            onChange={(e) => setForm({...form, title: e.target.value})}
            placeholder="Жишээ: Мастер урлаач"
          />
        </div>

        <div>
          <Label htmlFor="productsCount">Бүтээгдэхүүний тоо</Label>
          <Input
            id="productsCount"
            type="number"
            value={form.productsCount || 0}
            onChange={(e) => setForm({...form, productsCount: parseInt(e.target.value) || 0})}
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="yearsExperience">Туршлага (жил)</Label>
          <Input
            id="yearsExperience"
            type="number"
            value={form.yearsExperience || 0}
            onChange={(e) => setForm({...form, yearsExperience: parseInt(e.target.value) || 0})}
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="happyCustomers">Сэтгэл ханамжтай үйлчлүүлэгч</Label>
          <Input
            id="happyCustomers"
            type="number"
            value={form.happyCustomers || 0}
            onChange={(e) => setForm({...form, happyCustomers: parseInt(e.target.value) || 0})}
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="is_active">Төлөв</Label>
          <select
            id="is_active"
            value={form.isActive ? "active" : "inactive"}
            onChange={(e) => setForm({...form, isActive: e.target.value === "active"})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="active">Идэвхтэй</option>
            <option value="inactive">Идэвхгүй</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="image">Зураг</Label>
          <div className="mt-2 space-y-2">
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-gray-500">PNG, JPG, GIF хэлбэртэй зураг оруулна уу (5MB хүртэл)</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Цуцлах
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            artist ? "Хадгалах" : "Үүсгэх"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<ArtistData[]>([]);
  const [editingArtist, setEditingArtist] = useState<ArtistData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, artistId?: string}>({open: false});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ArtistReviewData[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [reviewSearchTerm, setReviewSearchTerm] = useState("");
  const [reviewFilter, setReviewFilter] = useState<string>("all");
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [deleteReviewDialog, setDeleteReviewDialog] = useState<{open: boolean, reviewId?: string}>({open: false});

  // Fetch artists from API
  const fetchArtists = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setArtists(result.data);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching artists:', err);
      setError(err instanceof Error ? err.message : 'Урлаачдын мэдээлэл авахад алдаа гарлаа');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch artists on component mount
  useEffect(() => {
    fetchArtists();
  }, []);

  // Create artist via API
  const createArtist = async (artistData: Omit<ArtistData, "id" | "createdAt" | "updatedAt"> & { imageFile?: File }) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      const formData = new FormData();
      formData.append('name', artistData.name);
      if (artistData.nameMn) formData.append('nameMn', artistData.nameMn);
      if (artistData.bio) formData.append('bio', artistData.bio);
      if (artistData.bioMn) formData.append('bioMn', artistData.bioMn);
      if (artistData.phone) formData.append('phone', artistData.phone);
      if (artistData.email) formData.append('email', artistData.email);
      formData.append('isActive', artistData.isActive.toString());
      
      if (artistData.imageFile) {
        formData.append('image', artistData.imageFile);
      }
      
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setShowForm(false);
        setSuccess("Урлаач амжилттай үүсгэгдлээ");
        setTimeout(() => fetchArtists(), 500);
      } else {
        throw new Error(result.message || 'Урлаач үүсгэхэд алдаа гарлаа');
      }
    } catch (err) {
      console.error('Error creating artist:', err);
      setError(err instanceof Error ? err.message : 'Урлаач үүсгэхэд алдаа гарлаа');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Update artist via API
  const updateArtist = async (artistData: Omit<ArtistData, "id" | "createdAt" | "updatedAt"> & { imageFile?: File }) => {
    try {
      if (!editingArtist) return;
      
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      const formData = new FormData();
      formData.append('name', artistData.nameMn || artistData.name || '');
      if (artistData.nameMn) formData.append('nameMn', artistData.nameMn);
      if (artistData.bioMn) formData.append('bio', artistData.bioMn);
      if (artistData.bioMn) formData.append('bioMn', artistData.bioMn);
      if (artistData.phone) formData.append('phone', artistData.phone);
      if (artistData.email) formData.append('email', artistData.email);
      if (artistData.location) formData.append('location', artistData.location);
      if (artistData.category) formData.append('category', artistData.category);
      if (artistData.title) formData.append('title', artistData.title);
      formData.append('productsCount', (artistData.productsCount || 0).toString());
      formData.append('yearsExperience', (artistData.yearsExperience || 0).toString());
      formData.append('happyCustomers', (artistData.happyCustomers || 0).toString());
      formData.append('isActive', artistData.isActive.toString());
      
      if (artistData.imageFile) {
        formData.append('image', artistData.imageFile);
      }
      
      const response = await fetch(`${API_URL}/${editingArtist.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setEditingArtist(null);
        setShowForm(false);
        setSuccess("Урлаач амжилттай шинэчлэгдлээ");
        setTimeout(() => fetchArtists(), 500);
      } else {
        throw new Error(result.message || 'Урлаач шинэчлэхэд алдаа гарлаа');
      }
    } catch (err) {
      console.error('Error updating artist:', err);
      setError(err instanceof Error ? err.message : 'Урлаач шинэчлэхэд алдаа гарлаа');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Delete artist via API
  const deleteArtist = async (artistId: string) => {
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`${API_URL}/${artistId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setArtists(artists.filter(artist => artist.id !== artistId));
        setDeleteDialog({open: false});
        setSuccess("Урлаач амжилттай устгагдлаа");
        setTimeout(() => fetchArtists(), 500);
      } else {
        throw new Error(result.message || 'Урлаач устгахад алдаа гарлаа');
      }
    } catch (err) {
      console.error('Error deleting artist:', err);
      setError(err instanceof Error ? err.message : 'Урлаач устгахад алдаа гарлаа');
    }
  };

  // Filter artists based on search and filters
  const filteredArtists = artists.filter(artist => {
    const matchesSearch = 
      (artist.nameMn || artist.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (artist.phone && artist.phone.includes(searchTerm)) ||
      (artist.email && artist.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && artist.isActive) ||
      (statusFilter === "inactive" && !artist.isActive);

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalArtists: artists.length,
    activeArtists: artists.filter(a => a.isActive).length,
    inactiveArtists: artists.filter(a => !a.isActive).length,
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('mn-MN');
  };

  // Fetch reviews for an artist
  const fetchReviews = async (artistId?: string) => {
    try {
      setIsLoadingReviews(true);
      setError(null);
      
      const url = artistId 
        ? `${REVIEW_API_URL}/artist/${artistId}`
        : REVIEW_API_URL;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setReviews(result.data);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Сэтгэгдэл авахад алдаа гарлаа');
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Delete review
  const deleteReview = async (reviewId: string) => {
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`${REVIEW_API_URL}/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setReviews(reviews.filter(review => review.id !== reviewId));
        setDeleteReviewDialog({open: false});
        setSuccess("Сэтгэгдэл амжилттай устгагдлаа");
        setTimeout(() => fetchReviews(selectedArtistId || undefined), 500);
      } else {
        throw new Error(result.message || 'Сэтгэгдэл устгахад алдаа гарлаа');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      setError(err instanceof Error ? err.message : 'Сэтгэгдэл устгахад алдаа гарлаа');
    }
  };

  // Update review approval status
  const updateReviewApproval = async (reviewId: string, isApproved: boolean) => {
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`${REVIEW_API_URL}/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isApproved })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setReviews(reviews.map(review => 
          review.id === reviewId ? { ...review, isApproved } : review
        ));
        setSuccess(isApproved ? "Сэтгэгдэл баталгаажлаа" : "Сэтгэгдэлийн баталгаа цуцлагдлаа");
        setTimeout(() => fetchReviews(selectedArtistId || undefined), 500);
      } else {
        throw new Error(result.message || 'Сэтгэгдэл шинэчлэхэд алдаа гарлаа');
      }
    } catch (err) {
      console.error('Error updating review:', err);
      setError(err instanceof Error ? err.message : 'Сэтгэгдэл шинэчлэхэд алдаа гарлаа');
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.userName.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
      (review.comment && review.comment.toLowerCase().includes(reviewSearchTerm.toLowerCase())) ||
      (review.title && review.title.toLowerCase().includes(reviewSearchTerm.toLowerCase()));
    
    const matchesFilter = reviewFilter === "all" || 
      (reviewFilter === "approved" && review.isApproved) ||
      (reviewFilter === "pending" && !review.isApproved) ||
      (reviewFilter === "rating_5" && review.rating === 5) ||
      (reviewFilter === "rating_4" && review.rating === 4) ||
      (reviewFilter === "rating_3" && review.rating === 3) ||
      (reviewFilter === "rating_2" && review.rating === 2) ||
      (reviewFilter === "rating_1" && review.rating === 1);

    return matchesSearch && matchesFilter;
  });

  // Open reviews for an artist
  const openReviews = (artistId: string) => {
    setSelectedArtistId(artistId);
    setShowReviews(true);
    fetchReviews(artistId);
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return "/default-category.jpg";
    if (imagePath.startsWith('http')) return imagePath;
    return imagePath;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Урлаачдын мэдээлэл уншиж байна...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Урлаачдын удирдлага</h2>
          <p className="text-gray-600">Бөөгийн урлал зардаг дэлгүүрийн урлаачдын мэдээлэл</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => { setSelectedArtistId(null); setShowReviews(true); fetchReviews(); }}
            className="flex items-center gap-2"
          >
            <MessageSquare size={16} />
            Бүх сэтгэгдэл
          </Button>
          <Button 
            onClick={() => { setEditingArtist(null); setShowForm(true); setError(null); }}
            className="flex items-center gap-2"
          >
            <UserPlus size={16} />
            Шинэ урлаач
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <div className="text-sm text-red-800">{error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start">
            <div className="text-sm text-green-800">{success}</div>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт урлаач</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArtists}</div>
            <p className="text-xs text-muted-foreground">
              Бүртгэлтэй урлаачид
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Идэвхтэй урлаач</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeArtists}</div>
            <p className="text-xs text-muted-foreground">
              Идэвхтэй урлаачид
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Идэвхгүй урлаач</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactiveArtists}</div>
            <p className="text-xs text-muted-foreground">
              Идэвхгүй урлаачид
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 max-w-md w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Нэр, утас, имэйлаар хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Бүх төлөв</option>
                <option value="active">Идэвхтэй</option>
                <option value="inactive">Идэвхгүй</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Artist Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingArtist ? "Урлаач засах" : "Шинэ урлаач үүсгэх"}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ArtistForm
              artist={editingArtist || undefined}
              onSubmit={editingArtist ? updateArtist : createArtist}
              onCancel={() => { setShowForm(false); setEditingArtist(null); }}
              isLoading={isFormLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Artist Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Урлаачдын жагсаалт</span>
            <span className="text-sm text-muted-foreground">
              {filteredArtists.length} урлаач
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Зураг</th>
                  <th className="text-left p-3">Нэр</th>
                  <th className="text-left p-3">Байршил / Ангилал</th>
                  <th className="text-left p-3">Гарчиг</th>
                  <th className="text-left p-3">Статистик</th>
                  <th className="text-left p-3">Төлөв</th>
                  <th className="text-left p-3">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filteredArtists.map((artist) => (
                  <tr key={artist.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {artist.image ? (
                        <img
                          src={getImageUrl(artist.image)}
                          alt={artist.nameMn || artist.name}
                          className="w-12 h-12 object-cover rounded-md border"
                          onError={(e) => {
                            e.currentTarget.src = "/default-category.jpg";
                            e.currentTarget.onerror = null;
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{artist.nameMn || artist.name}</div>
                        {artist.phone && (
                          <div className="text-xs text-gray-500 mt-1">{artist.phone}</div>
                        )}
                        {artist.email && (
                          <div className="text-xs text-gray-500">{artist.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        {artist.location && (
                          <div className="font-medium">{artist.location}</div>
                        )}
                        {artist.category && (
                          <div className="text-xs text-gray-500">{artist.category}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {artist.title && (
                        <Badge variant="outline">{artist.title}</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="text-xs space-y-1">
                        {artist.productsCount !== undefined && (
                          <div>Бүтээгдэхүүн: {artist.productsCount}</div>
                        )}
                        {artist.yearsExperience !== undefined && (
                          <div>Туршлага: {artist.yearsExperience}+ жил</div>
                        )}
                        {artist.happyCustomers !== undefined && (
                          <div>Үйлчлүүлэгч: {artist.happyCustomers}+</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getStatusColor(artist.isActive)}>
                        {artist.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditingArtist(artist); setShowForm(true); setError(null); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReviews(artist.id)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteDialog({open: true, artistId: artist.id})}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredArtists.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Урлаач олдсонгүй
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Урлаач устгах уу?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Энэ үйлдлийг буцаах боломжгүй. Та устгахдаа итгэлтэй байна уу?
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteDialog({open: false})}>
                Цуцлах
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteDialog.artistId && deleteArtist(deleteDialog.artistId)}
              >
                Устгах
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reviews Management Dialog */}
      <Dialog open={showReviews} onOpenChange={(open) => { setShowReviews(open); if (!open) setSelectedArtistId(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Үйлчлүүлэгчдийн сэтгэгдэл</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Review Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1 max-w-md w-full">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Хэрэглэгч, сэтгэгдлээр хайх..."
                        value={reviewSearchTerm}
                        onChange={(e) => setReviewSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={reviewFilter} onValueChange={setReviewFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Шүүх" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүх сэтгэгдэл</SelectItem>
                      <SelectItem value="approved">Баталгаажсан</SelectItem>
                      <SelectItem value="pending">Хүлээгдэж буй</SelectItem>
                      <SelectItem value="rating_5">5 од</SelectItem>
                      <SelectItem value="rating_4">4 од</SelectItem>
                      <SelectItem value="rating_3">3 од</SelectItem>
                      <SelectItem value="rating_2">2 од</SelectItem>
                      <SelectItem value="rating_1">1 од</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            {isLoadingReviews ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-medium">{review.userName}</div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <Badge variant={review.isApproved ? "default" : "secondary"}>
                              {review.isApproved ? "Баталгаажсан" : "Хүлээгдэж буй"}
                            </Badge>
                          </div>
                          {review.title && (
                            <div className="font-semibold mb-1">{review.title}</div>
                          )}
                          <div className="text-sm text-gray-600 mb-2">{review.comment}</div>
                          <div className="text-xs text-gray-400">
                            {formatDate(review.createdAt)} • {review.helpfulCount} хэрэгтэй
                          </div>
                          {review.artist && (
                            <div className="text-xs text-gray-500 mt-2">
                              Урлаач: {review.artist.nameMn || review.artist.name}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReviewApproval(review.id, !review.isApproved)}
                          >
                            {review.isApproved ? "Цуцлах" : "Баталгаажуулах"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteReviewDialog({open: true, reviewId: review.id})}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredReviews.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Сэтгэгдэл олдсонгүй
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Review Confirmation Dialog */}
      <Dialog open={deleteReviewDialog.open} onOpenChange={(open) => setDeleteReviewDialog({open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сэтгэгдэл устгах уу?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Энэ үйлдлийг буцаах боломжгүй. Та устгахдаа итгэлтэй байна уу?
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteReviewDialog({open: false})}>
                Цуцлах
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteReviewDialog.reviewId && deleteReview(deleteReviewDialog.reviewId)}
              >
                Устгах
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


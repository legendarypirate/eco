"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Plus, Trash2, ArrowUp, ArrowDown, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgpk9aqnc';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

interface Banner {
  id?: string;
  text?: string;
  link?: string;
  image: string;
  order?: number;
  isActive?: boolean;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Banner>({ image: '' });

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/banner`;

  // Get auth token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Fetch banners
  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBanners(data);
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  // Upload image to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'banners');
      formData.append('tags', 'banner_image');

      const xhr = new XMLHttpRequest();

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, bannerId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(bannerId || 'new');
      const imageUrl = await uploadToCloudinary(file);
      
      if (bannerId) {
        // Update existing banner
        setEditForm({ ...editForm, image: imageUrl });
      } else {
        // New banner
        setEditForm({ ...editForm, image: imageUrl });
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(null);
    }
  };

  // Create new banner
  const createBanner = async () => {
    if (!editForm.image) {
      setError('Зураг оруулах шаардлагатай');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = getAuthToken();
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          text: editForm.text || '',
          link: editForm.link || '',
          image: editForm.image,
          isActive: editForm.isActive !== undefined ? editForm.isActive : true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setSuccess('Баннер амжилттай нэмэгдлээ');
      setEditForm({ image: '' });
      await fetchBanners();
    } catch (err) {
      console.error('Error creating banner:', err);
      setError(err instanceof Error ? err.message : 'Failed to create banner');
    } finally {
      setSaving(false);
    }
  };

  // Update banner
  const updateBanner = async (id: string) => {
    if (!editForm.image) {
      setError('Зураг оруулах шаардлагатай');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = getAuthToken();
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setSuccess('Баннер амжилттай шинэчлэгдлээ');
      setEditingId(null);
      setEditForm({ image: '' });
      await fetchBanners();
    } catch (err) {
      console.error('Error updating banner:', err);
      setError(err instanceof Error ? err.message : 'Failed to update banner');
    } finally {
      setSaving(false);
    }
  };

  // Delete banner
  const deleteBanner = async (id: string) => {
    if (!confirm('Энэ баннерыг устгахдаа итгэлтэй байна уу?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = getAuthToken();
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setSuccess('Баннер амжилттай устгагдлаа');
      await fetchBanners();
    } catch (err) {
      console.error('Error deleting banner:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete banner');
    } finally {
      setSaving(false);
    }
  };

  // Start editing
  const startEdit = (banner: Banner) => {
    setEditingId(banner.id || null);
    setEditForm({ ...banner });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ image: '' });
  };

  // Move banner order
  const moveBanner = async (id: string, direction: 'up' | 'down') => {
    const bannerIndex = banners.findIndex(b => b.id === id);
    if (bannerIndex === -1) return;

    const newIndex = direction === 'up' ? bannerIndex - 1 : bannerIndex + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const updatedBanners = [...banners];
    const [movedBanner] = updatedBanners.splice(bannerIndex, 1);
    updatedBanners.splice(newIndex, 0, movedBanner);

    // Update orders
    updatedBanners.forEach((banner, index) => {
      banner.order = index;
    });

    setBanners(updatedBanners);

    // Save order changes
    try {
      const token = getAuthToken();
      for (const banner of updatedBanners) {
        if (banner.id) {
          await fetch(`${API_URL}/${banner.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ order: banner.order }),
          });
        }
      }
    } catch (err) {
      console.error('Error updating banner order:', err);
      await fetchBanners(); // Revert on error
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Баннер удирдлага</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Add New Banner Form */}
      <Card>
        <CardHeader>
          <CardTitle>Шинэ баннер нэмэх</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-image">Зураг *</Label>
            <Input
              id="new-image"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e)}
              disabled={uploading === 'new'}
            />
            {uploading === 'new' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Зураг оруулж байна...
              </div>
            )}
            {editForm.image && (
              <div className="mt-2">
                <img
                  src={editForm.image}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded border"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-text">Текст (сонголттой)</Label>
            <Input
              id="new-text"
              value={editForm.text || ''}
              onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
              placeholder="Баннерын текст"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-link">Холбоос (сонголттой)</Label>
            <Input
              id="new-link"
              value={editForm.link || ''}
              onChange={(e) => setEditForm({ ...editForm, link: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="new-active"
              checked={editForm.isActive !== false}
              onCheckedChange={(checked) =>
                setEditForm({ ...editForm, isActive: checked as boolean })
              }
            />
            <Label htmlFor="new-active" className="cursor-pointer">
              Идэвхтэй
            </Label>
          </div>

          <Button
            onClick={createBanner}
            disabled={saving || !editForm.image || uploading === 'new'}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Хадгалж байна...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Нэмэх
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Banners */}
      <Card>
        <CardHeader>
          <CardTitle>Баннерууд ({banners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <p className="text-muted-foreground">Одоогоор баннер байхгүй байна.</p>
          ) : (
            <div className="space-y-4">
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className="border rounded-lg p-4 space-y-4"
                >
                  {editingId === banner.id ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Зураг *</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, banner.id)}
                          disabled={uploading === banner.id}
                        />
                        {uploading === banner.id && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Зураг оруулж байна...
                          </div>
                        )}
                        {editForm.image && (
                          <div className="mt-2">
                            <img
                              src={editForm.image}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Текст</Label>
                        <Input
                          value={editForm.text || ''}
                          onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Холбоос</Label>
                        <Input
                          value={editForm.link || ''}
                          onChange={(e) => setEditForm({ ...editForm, link: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={editForm.isActive !== false}
                          onCheckedChange={(checked) =>
                            setEditForm({ ...editForm, isActive: checked as boolean })
                          }
                        />
                        <Label className="cursor-pointer">Идэвхтэй</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateBanner(banner.id!)}
                          disabled={saving || !editForm.image}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Хадгалж байна...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Хадгалах
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={cancelEdit}>
                          Цуцлах
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2">
                            <img
                              src={banner.image}
                              alt={banner.text || 'Banner'}
                              className="w-full h-48 object-cover rounded border"
                            />
                          </div>
                          {banner.text && (
                            <p className="text-sm font-medium mb-1">Текст: {banner.text}</p>
                          )}
                          {banner.link && (
                            <p className="text-sm text-muted-foreground mb-1">
                              Холбоос: <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{banner.link}</a>
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {banner.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Дараалал: {banner.order !== undefined ? banner.order + 1 : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveBanner(banner.id!, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveBanner(banner.id!, 'down')}
                          disabled={index === banners.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(banner)}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Засах
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteBanner(banner.id!)}
                          disabled={saving}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Устгах
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import ToastNotification from '@/components/modal/message-modal';

import {
  handleProfileEdit,
  handleProfileClick
} from '@/lib/api-action/api-profile';

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.03);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, rgba(168, 85, 247, 0.5), rgba(236, 72, 153, 0.5));
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, rgba(168, 85, 247, 0.7), rgba(236, 72, 153, 0.7));
  }
  .scroll-fade-bottom {
    position: relative;
  }
  .scroll-fade-bottom.fade-active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 30px;
    background: linear-gradient(to top, rgba(255, 255, 255, 0.9), transparent);
    pointer-events: none;
  }
  .dark .scroll-fade-bottom.fade-active::after {
    background: linear-gradient(to top, rgba(17, 17, 17, 0.9), transparent);
  }
`;

interface ProfileData {
  username: string;
  display_name: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  photos: number;
  social_link: string;
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  profile
}: ProfileEditModalProps) {
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('success');
  const [toastMessage, setToastMessage] = useState({
    title: '',
    description: '',
    duration: 0
  });

  const [formData, setFormData] = useState<ProfileData | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const setNotification = (
    variant: 'success' | 'error' | 'info' | 'warning',
    title: string,
    description: string,
    duration: number
  ) => {
    setToastVariant(variant);
    setToastMessage({ title, description, duration });
    setToastOpen(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          const data = await handleProfileClick(profile.username);
          setFormData(data);
          setPreviewAvatar(null);
        } catch (error) {
          console.error('Error fetching profile data:', error);
          setFormData(profile);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [isOpen, profile]);

  useEffect(() => {
    const checkScroll = () => {
      if (contentRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = contentRef.current;
        const isScrollable = scrollHeight > clientHeight;
        const isNotAtBottom = scrollTop + clientHeight < scrollHeight - 10;
        setShowBottomFade(isScrollable && isNotAtBottom);
      }
    };

    checkScroll();

    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSubmitting(true);
    try {
      const updatedData = new FormData();
      updatedData.append('display_name', formData.display_name);
      updatedData.append('bio', formData.bio || '');
      updatedData.append('social_link', formData.social_link || '');

      if (fileInputRef.current?.files?.[0]) {
        updatedData.append('avatar', fileInputRef.current.files[0]);
      }

      await handleProfileEdit(updatedData);
      setNotification(
        'success',
        'Success',
        'Successfully updated your profile.',
        3000
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification(
        'error',
        'Error',
        'Fail to update your profile, try again!',
        3000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='sm:max-w-[500px] border-none bg-gradient-to-br from-white to-purple-50 dark:from-gray-950 dark:to-purple-950/20 backdrop-blur-sm'>
          <div className='flex flex-col items-center justify-center py-12'>
            <div className='w-16 h-16 relative'>
              <div className='absolute inset-0 rounded-full border-t-2 border-purple-600 animate-spin'></div>
              <div className='absolute inset-2 rounded-full border-t-2 border-pink-600 animate-spin animation-delay-150'></div>
              <div className='absolute inset-4 rounded-full border-t-2 border-fuchsia-600 animate-spin animation-delay-300'></div>
            </div>
            <p className='mt-4 text-purple-600 dark:text-purple-400 animate-pulse'>
              Loading profile...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!formData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='sm:max-w-[500px] border-none bg-gradient-to-br from-white to-purple-50 dark:from-gray-950 dark:to-purple-950/20 backdrop-blur-sm'>
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <div className='w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4'>
              <span className='text-2xl text-red-500'>!</span>
            </div>
            <p className='text-red-500 mb-4 font-medium'>
              Failed to load profile data
            </p>
            <Button
              variant='outline'
              onClick={onClose}
              className='transition-all hover:shadow-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-purple-200 dark:border-purple-900/30 hover:border-purple-400 dark:hover:border-purple-700'
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <style jsx global>
        {scrollbarStyles}
      </style>
      <DialogContent className='sm:max-w-[500px] max-h-[95vh] overflow-hidden border-none bg-gradient-to-br from-white to-purple-50 dark:from-gray-950 dark:to-purple-950/20 backdrop-blur-sm shadow-xl'>
        <DialogHeader className='pb-2'>
          <DialogTitle className='text-2xl font-bold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-600 text-transparent bg-clip-text'>
            Edit Profile
          </DialogTitle>
          <div className='h-1 w-32 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mt-1'></div>
        </DialogHeader>

        <div
          ref={contentRef}
          className={`custom-scrollbar overflow-y-auto px-2 scroll-fade-bottom ${
            showBottomFade ? 'fade-active' : ''
          }`}
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          <form onSubmit={handleSubmit} className='space-y-6 py-4'>
            <div className='flex flex-col items-center space-y-4'>
              <div
                className='relative w-28 h-28 rounded-full overflow-hidden border-2 border-primary cursor-pointer group shadow-lg ring-4 ring-purple-200 dark:ring-purple-900/30'
                onClick={handleAvatarClick}
              >
                <Image
                  src={
                    previewAvatar ||
                    formData.avatar ||
                    '/placeholder.svg?height=112&width=112'
                  }
                  alt='Profile avatar'
                  fill
                  className='object-cover'
                />
                <div className='absolute inset-0 bg-gradient-to-br from-purple-500/60 to-pink-500/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300'>
                  <Camera className='w-10 h-10 text-white drop-shadow-md' />
                </div>
              </div>
              <input
                type='file'
                ref={fileInputRef}
                onChange={handleFileChange}
                accept='image/*'
                className='hidden'
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleAvatarClick}
                className='transition-all hover:shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-purple-200 dark:border-purple-900/30 hover:border-purple-400 dark:hover:border-purple-700'
              >
                <Upload className='mr-2 h-4 w-4 text-purple-600' />
                Change Avatar
              </Button>
            </div>

            <div className='space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='display_name' className='text-sm font-medium'>
                  Display Name
                </Label>
                <Input
                  id='display_name'
                  name='display_name'
                  value={formData.display_name}
                  onChange={handleChange}
                  className='focus-visible:ring-purple-500 focus-visible:ring-offset-0 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='bio' className='text-sm font-medium'>
                  Bio
                </Label>
                <Textarea
                  id='bio'
                  name='bio'
                  value={formData.bio || ''}
                  onChange={handleChange}
                  rows={4}
                  className='focus-visible:ring-purple-500 focus-visible:ring-offset-0 resize-none transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='social_link' className='text-sm font-medium'>
                  Social Link
                </Label>
                <Input
                  id='social_link'
                  name='social_link'
                  value={formData.social_link || ''}
                  onChange={handleChange}
                  className='focus-visible:ring-purple-500 focus-visible:ring-offset-0 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm'
                  placeholder='https://example.com'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-sm'>Account Information</Label>
                <div className='p-4 rounded-md bg-white/50 dark:bg-gray-900/50 border border-purple-100 dark:border-purple-900/30 backdrop-blur-sm shadow-sm'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-1'>
                      <p className='text-sm text-purple-600 dark:text-purple-400 font-medium'>
                        Username
                      </p>
                      <p className='text-sm font-medium'>@{profile.username}</p>
                    </div>
                    <div className='space-y-1'>
                      <p className='text-sm text-purple-600 dark:text-purple-400 font-medium'>
                        Followers
                      </p>
                      <p className='text-sm font-medium'>
                        {profile.followers?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className='space-y-1'>
                      <p className='text-sm text-purple-600 dark:text-purple-400 font-medium'>
                        Following
                      </p>
                      <p className='text-sm font-medium'>
                        {profile.following?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className='space-y-1'>
                      <p className='text-sm text-purple-600 dark:text-purple-400 font-medium'>
                        Photos
                      </p>
                      <p className='text-sm font-medium'>
                        {profile.photos?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className='sm:justify-between mt-4 pt-2 border-t border-purple-100 dark:border-purple-900/30'>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            className='transition-all hover:shadow-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-purple-200 dark:border-purple-900/30 hover:border-purple-400 dark:hover:border-purple-700'
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className='bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-600 hover:from-purple-700 hover:via-fuchsia-600 hover:to-pink-700 transition-all hover:shadow-md'
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className='animate-spin mr-2'>⟳</span> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
      <ToastNotification
        variant={toastVariant}
        title={toastMessage.title}
        description={toastMessage.description}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        duration={toastMessage.duration}
      />
    </Dialog>
  );
}

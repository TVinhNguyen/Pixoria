'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heart,
  ImageIcon,
  Download,
  Grid,
  Edit,
  Share2,
  LinkIcon,
  Trash,
  UnfoldHorizontal
} from 'lucide-react';
import {
  useQuery,
  useQueryClient,
  UseQueryResult
} from '@tanstack/react-query';
import {
  handleProfileClick,
  loadAllUploadedImages,
  loadAllLikedImages,
  loadAllDownloadedImages
} from '@/lib/api-action/api-profile';
import { handleGetCollectionById } from '@/lib/api-action/api-collection';
import { Collection } from '@/components/modal/collections/edit-collection-modal';

// Import getAllFollowers and getAllFollowings
import { getAllFollowers, getAllFollowings } from '@/lib/api-action/api-follow';
import {
  handleGetCollections,
  handleDeleteCollection
} from '@/lib/api-action/api-collection';
import { handleLike } from '@/lib/api-action/image-actions';
import ProfileEditModal from '@/components/modal/edit-profile-modal';
import EditCollectionModal from '@/components/modal/collections/edit-collection-modal';
import CollectionImagesModal from '@/components/modal/collections/collection-images-modal';
import FollowsModal from '@/components/modal/follow/follow-modal';
import ToastNotification from '@/components/modal/message-modal';
import { useLocalStorage } from '@/hooks/use-localStorage';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Header from '@/components/header';
import { ConfirmationDialog } from '@/components/modal/confirmation/comfirmation-dialog';

// Define interfaces for this component
interface UserDetails {
  id: number;
  username: string;
  display_name?: string;
  avatar?: string;
}

function ProfileContent() {
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('success');
  const [toastMessage, setToastMessage] = useState({
    title: '',
    description: '',
    duration: 0
  });

  const router = useRouter();
  const tabParams = useSearchParams();
  const defaultTab = tabParams.get('tab') || 'photos';
  const [tab, setTab] = useState(defaultTab);

  // Only run certain operations on client-side to avoid SSR issues
  useEffect(() => {
    // Client-side initialization
  }, []);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    number | null
  >(null);
  const [isEditCollectionModalOpen, setIsEditCollectionModalOpen] =
    useState(false);
  const [isCollectionImagesOpen, setIsCollectionImagesOpen] = useState(false);
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);
  const [collectionData, setCollectionData] = useState<Collection | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<number | null>(
    null
  );
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteConfirmImageOpen, setIsDeleteConfirmImageOpen] =
    useState(false);

  // handle cái nút unlike ở tab like (để thêm chức năng unlike cho hắn nhiều)  const [isUnlikeImage, setUnlikeImage] = useState(false);

  const queryClient = useQueryClient();
  // Sử dụng custom hook cho localStorage để tránh lỗi server-side rendering
  const [username, , isClient] = useLocalStorage('username', 'guest');
  const [userId] = useLocalStorage('user_id', '');
  // Profile data
  const {
    data: profileData,
    isLoading: profileLoading
  }: UseQueryResult<any, Error> = useQuery({
    queryKey: ['profile', username],
    queryFn: () => handleProfileClick(username),
    enabled: isClient, // Chỉ chạy khi đã ở client side
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  // Query cho user images
  const {
    data: userImages = [],
    isLoading: imagesLoading
  }: UseQueryResult<any[], Error> = useQuery({
    queryKey: ['userImages'],
    queryFn: loadAllUploadedImages,
    enabled: tab === 'photos',
    staleTime: 5 * 60 * 1000
  });

  // Query cho collections
  const {
    data: collectionsData,
    isLoading: collectionsLoading
  }: UseQueryResult<{ results: (Collection & { images: number[] })[] }, Error> =
    useQuery({
      queryKey: ['collections'],
      queryFn: handleGetCollections,
      enabled: tab === 'collections',
      staleTime: 5 * 60 * 1000
    });

  const collections = collectionsData?.results || [];

  // Query cho liked images
  const {
    data: likedImages = [],
    isLoading: likedImagesLoading
  }: UseQueryResult<any[], Error> = useQuery({
    queryKey: ['likedImages'],
    queryFn: loadAllLikedImages,
    enabled: tab === 'likes',
    staleTime: 5 * 60 * 1000
  });

  // Query cho downloaded images
  const {
    data: downloadedImages = [],
    isLoading: downloadedImagesLoading
  }: UseQueryResult<any[], Error> = useQuery({
    queryKey: ['downloadedImages'],
    queryFn: loadAllDownloadedImages,
    enabled: tab === 'downloads',
    staleTime: 5 * 60 * 1000
  });

  // Fetch collection data manually
  useEffect(() => {
    const fetchCollectionData = async () => {
      if (isEditCollectionModalOpen && selectedCollectionId) {
        try {
          const data = await handleGetCollectionById(
            '',
            selectedCollectionId.toString()
          );
          setCollectionData(data);
        } catch (error: any) {
          // Handle collection fetch error
          setToastVariant('error');
          setToastMessage({
            title: 'Error',
            description: 'Failed to load collection data.',
            duration: 3000
          });
          setToastOpen(true);
        }
      }
    };

    fetchCollectionData();
  }, [isEditCollectionModalOpen, selectedCollectionId]);
  // Query cho followers
  const {
    data: followersData = { followers: [] }
  }: UseQueryResult<{ followers: UserDetails[] }, Error> = useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      const result = await getAllFollowers(Number(userId));
      if (Array.isArray(result)) {
        return { followers: result };
      }
      return result;
    },
    enabled: isFollowersOpen && isClient,
    staleTime: 5 * 60 * 1000
  });

  const followersList = followersData.followers;

  // Query cho following
  const {
    data: followingData = { followings: [] }
  }: UseQueryResult<{ followings: UserDetails[] }, Error> = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      const result = await getAllFollowings(Number(userId));
      if (Array.isArray(result)) {
        return { followings: result };
      }
      return result;
    },
    enabled: isFollowingOpen && isClient,
    staleTime: 5 * 60 * 1000
  });

  const followingList = followingData.followings || [];

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

  // viết ri dùng được cho 4 tab, thay vì if else như cũ
  const handleTabChange = (value: string) => {
    setTab(value);
    router.push(`/profile?tab=${value}`);
  };

  const handleClickShare = () => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url);
    setNotification(
      'success',
      'Success',
      'Sucessfully copy your profile link to clipboard.',
      3000
    );
  };

  const handleUnlike = async (imageId: number) => {
    try {
      // cập nhật giao diện, loại bỏ ảnh đã unlike
      queryClient.setQueryData(['likedImages'], (old: any[] | undefined) =>
        old ? old.filter(image => image.id !== imageId) : []
      );

      // fetch API để lưu ảnh trong db
      await handleLike(imageId);

      // cập nhật lại cache
      await queryClient.invalidateQueries({ queryKey: ['likedImages'] });

      // thông báo là đã thành công
      setNotification(
        'success',
        'Success',
        'Image unliked successfully.',
        3000
      );
    } catch (error: any) {
      queryClient.invalidateQueries({ queryKey: ['likedImages'] });
      setNotification('error', 'Error', 'Failed to unlike the image.', 3000);
      // Log error silently or use a monitoring tool
    }
  };

  // Khi bấm nút xóa, mở dialog xác nhận
  const handleDeleteImageClick = (imageId: number) => {
    setImageToDelete(imageId);
    setIsDeleteConfirmImageOpen(true);
  };

  // Hàm thực hiện xóa thật sự khi xác nhận
  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;
    try {
      const res = await import('@/lib/api-action/image-actions');
      const result = await res.handleDeleteImage(imageToDelete);
      if (result.status === 'success') {
        setToastVariant('success');
        setToastMessage({
          title: 'Image Deleted',
          description: 'The image has been deleted successfully.',
          duration: 3000
        });
        setToastOpen(true);
        await queryClient.invalidateQueries();
      } else {
        setToastVariant('error');
        setToastMessage({
          title: 'Error',
          description: result.detail || 'Failed to delete the image.',
          duration: 3000
        });
        setToastOpen(true);
      }
    } catch (error) {
      setToastVariant('error');
      setToastMessage({
        title: 'Error',
        description: 'An error occurred while deleting the image.',
        duration: 3000
      });
      setToastOpen(true);
    } finally {
      setIsDeleteConfirmImageOpen(false);
      setImageToDelete(null);
    }
  };

  const handleDeleteCollectionClick = async (collectionId: number) => {
    setCollectionToDelete(collectionId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteCollection = async () => {
    if (!collectionToDelete) return;

    try {
      // cập nhật giao diện
      queryClient.setQueryData(
        ['collections'],
        (old: { results: (Collection & { images: number[] })[] } | undefined) => {
          if (!old || !Array.isArray(old.results)) return old;
          return {
            ...old,
            results: old.results.filter(
              (collection: Collection & { images: number[] }) => collection.id !== collectionToDelete
            )
          };
        }
      );
      await handleDeleteCollection(collectionToDelete.toString());
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      setNotification(
        'success',
        'Success',
        'Collection deleted successfully.',
        3000
      );
    } catch (error: any) {
      console.log(error);
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setNotification(
        'error',
        'Error',
        'Failed to delete the collection.',
        3000
      );
    }
  };

  const handleClickFollowing = () => {
    setIsFollowingOpen(true);
  };

  const handleClickFollowers = () => {
    setIsFollowersOpen(true);
  };

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (!isEditModalOpen) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  }, [isEditModalOpen, queryClient]);

  useEffect(() => {
    if (!isEditCollectionModalOpen) {
      setSelectedCollectionId(null);
      setCollectionData(null);
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    }
  }, [isEditCollectionModalOpen, queryClient]);

  useEffect(() => {
    if (!isCollectionImagesOpen) {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    }
  }, [isCollectionImagesOpen, queryClient]);

  if (profileLoading) {
    return (
      <div className='min-h-screen pt-16 flex items-center justify-center'>
        <div className='animate-pulse text-primary'>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen pt-16'>
      <div className='relative w-full h-48 md:h-64 bg-gradient-to-r from-purple-600 to-pink-600'>
        <div className='absolute -bottom-16 left-1/2 transform -translate-x-1/2'>
          <div className='relative h-32 w-32 overflow-hidden rounded-full border-4 border-background'>
            <Image
              src={
                profileData?.avatar || '/placeholder.svg?height=128&width=128'
              }
              alt='Profile picture'
              width={128}
              height={128}
              className='h-full w-full object-cover'
            />
            <button
              className='absolute bottom-0 right-0 bg-primary rounded-full p-1.5 shadow-md'
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className='h-4 w-4 text-white' />
            </button>
          </div>
        </div>
      </div>
      <div className='container mx-auto px-4 pt-20 pb-8'>
        <div className='flex flex-col items-center justify-center space-y-2 mb-8'>
          <h1 className='text-3xl font-bold'>
            {profileData?.display_name || 'User'}
          </h1>
          <p className='text-muted-foreground'>
            @{profileData?.username || 'username'}
          </p>
          <p className='text-center max-w-md mt-2'>
            {profileData?.bio || 'No bio yet'}
          </p>
          <div className='flex items-center gap-2 mt-2'>
            {profileData?.social_link && (
              <Button variant='outline' size='sm' asChild>
                <a
                  href={profileData.social_link}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <LinkIcon className='h-4 w-4 mr-2' />
                  Website
                </a>
              </Button>
            )}
            <Button variant='outline' size='sm' onClick={handleClickShare}>
              <Share2 className='h-4 w-4 mr-2' />
              Share
            </Button>
            <Button
              className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className='h-4 w-4 mr-2' />
              Edit Profile
            </Button>
          </div>
          <div className='flex justify-center gap-8 mt-4'>
            <div className='text-center'>
              <p className='text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text'>
                {profileData?.photos || 0}
              </p>
              <p className='text-sm text-muted-foreground'>
                {profileData?.photos > 1 ? 'Photos' : 'Photo'}
              </p>
            </div>
            <div
              className='text-center cursor-pointer'
              onClick={handleClickFollowers}
            >
              <p className='text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text'>
                {(profileData?.followers || 0).toLocaleString()}
              </p>
              <p className='text-sm text-muted-foreground'>
                {profileData?.followers > 1 ? 'Followers' : 'Follower'}
              </p>
            </div>
            <div
              className='text-center cursor-pointer'
              onClick={handleClickFollowing}
            >
              <p className='text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text'>
                {profileData?.following || 0}
              </p>
              <p className='text-sm text-muted-foreground'>Following</p>
            </div>
          </div>
        </div>

        <Tabs value={tab} className='w-full' onValueChange={handleTabChange}>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='photos'>
              <ImageIcon className='mr-2 h-4 w-4' />
              Photos
            </TabsTrigger>
            <TabsTrigger value='collections'>
              <Grid className='mr-2 h-4 w-4' />
              Collections
            </TabsTrigger>
            <TabsTrigger value='likes'>
              <Heart className='mr-2 h-4 w-4' />
              Likes
            </TabsTrigger>
            <TabsTrigger value='downloads'>
              <Download className='mr-2 h-4 w-4' />
              Downloads
            </TabsTrigger>
          </TabsList>

          <TabsContent value='photos' className='mt-6'>
            {imagesLoading ? (
              <div className='flex justify-center items-center h-40'>
                <div className='animate-pulse text-primary'>
                  Loading images...
                </div>
              </div>
            ) : userImages.length > 0 ? (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                {userImages.map((image, i) => (
                  <div
                    key={image.id}
                    className='group relative aspect-[4/3] overflow-hidden rounded-lg'
                  >
                    <Image
                      src={
                        image.file || `/placeholder.svg?height=300&width=400`
                      }
                      alt={image.title || `Photo ${i + 1}`}
                      width={400}
                      height={300}
                      className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
                    <div className='absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                      <span className='text-sm font-medium text-white'>
                        {image.title || `Photo ${i + 1}`}
                      </span>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 rounded-full bg-white/20 text-white backdrop-blur-sm'
                        onClick={() => handleDeleteImageClick(image.id)}
                      >
                        <Trash className='h-4 w-4 fill-current' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-10'>
                <p className='text-muted-foreground'>No photos uploaded yet</p>
                <Button className='mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
                  Upload Your First Photo
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value='collections' className='mt-6'>
            {collectionsLoading ? (
              <div className='flex justify-center items-center h-40'>
                <div className='animate-pulse text-primary'>
                  Loading collections...
                </div>
              </div>
            ) : collections.length === 0 ? (
              <div className='flex justify-center items-center h-40'>
                <div className='animate-pulse text-primary'>
                  No collections yet
                </div>
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3'>
                {collections.map(collection => (
                  <div
                    key={collection.id}
                    className='group relative aspect-video overflow-hidden rounded-lg'
                    onClick={() => {
                      setIsCollectionImagesOpen(true);
                      setSelectedCollectionId(collection.id);
                    }}
                  >
                    <Image
                      src={
                        collection.cover_image ||
                        `/placeholder.svg?height=300&width=500`
                      }
                      alt={collection.name}
                      width={500}
                      height={300}
                      className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/70 to-transparent' />
                    <div className='absolute bottom-0 left-0 right-0 p-4'>
                      <h3 className='text-lg font-bold text-white'>
                        {collection.name}
                      </h3>
                      <p className='text-sm text-gray-300'>
                        {collection.images &&
                        Array.isArray(collection.images) &&
                        collection.images.length > 0
                          ? collection.images.length > 1
                            ? `${collection.images.length} photos`
                            : `${collection.images.length} photo`
                          : '0 photo'}
                      </p>
                    </div>
                    <div className='absolute right-1 top-1 flex items-center gap-1 bg-black/40 rounded px-1 py-0.5'>
                      <Button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedCollectionId(collection.id);
                          setIsEditCollectionModalOpen(true);
                        }}
                        variant='ghost'
                        size='icon' // đổi size cho nhỏ hơn
                        className='text-white hover:bg-black/50 h-6 w-6 p-1'
                      >
                        <Edit className='h-3 w-3' />
                      </Button>

                      <UnfoldHorizontal className='text-white h-3 w-3' />

                      <Button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteCollectionClick(collection.id);
                        }}
                        variant='ghost'
                        size='icon'
                        className='text-white hover:bg-black/50 h-6 w-6 p-1'
                      >
                        <Trash className='h-3 w-3' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value='likes' className='mt-6'>
            {likedImagesLoading ? (
              <div className='flex justify-center items-center h-40'>
                <div className='animate-pulse text-primary'>
                  Loading liked images...
                </div>
              </div>
            ) : likedImages.length > 0 ? (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                {likedImages.map((image, i) => (
                  <div
                    key={image.id}
                    className='group relative aspect-[4/3] overflow-hidden rounded-lg'
                  >
                    <Image
                      src={
                        image.file || `/placeholder.svg?height=300&width=400`
                      }
                      alt={image.title || `Saved photo ${i + 1}`}
                      width={400}
                      height={300}
                      className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
                    <div className='absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                      <span className='text-sm font-medium text-white truncate max-w-[80%]'>
                        {image.title || `Saved ${i + 1}`}
                      </span>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 rounded-full bg-white/20 text-white backdrop-blur-sm'
                        onClick={() => handleUnlike(image.id)}
                      >
                        <Heart className='h-4 w-4 fill-current' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-10'>
                <p className='text-muted-foreground'>No liked photos yet</p>
                <Button className='mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
                  Browse Photos to Like
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value='downloads' className='mt-6'>
            {downloadedImagesLoading ? (
              <div className='flex justify-center items-center h-40'>
                <div className='animate-pulse text-primary'>
                  Loading downloaded images...
                </div>
              </div>
            ) : downloadedImages.length > 0 ? (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                {downloadedImages.map((image, i) => (
                  <div
                    key={image.id}
                    className='group relative aspect-[4/3] overflow-hidden rounded-lg'
                  >
                    <Image
                      src={
                        image.file || `/placeholder.svg?height=300&width=400`
                      }
                      alt={image.title || `Downloaded photo ${i + 1}`}
                      width={400}
                      height={300}
                      className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
                    <div className='absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium text-white'>
                          {image.title || `Downloaded ${i + 1}`}
                        </span>
                        {image.downloaded_at && (
                          <span className='text-xs text-white/70'>
                            Downloaded on{' '}
                            {new Date(image.downloaded_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-10'>
                <p className='text-muted-foreground'>
                  No downloaded photos yet
                </p>
                <Button className='mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'>
                  Browse Photos to Download
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      {profileData && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={{
            username: profileData.username || '',
            display_name: profileData.display_name || '',
            avatar: profileData.avatar || '',
            bio: profileData.bio || '',
            followers: profileData.followers || 0,
            following: profileData.following || 0,
            photos: profileData.photos || 0,
            social_link: profileData.social_link || ''
          }}
        />
      )}{' '}
      {isEditCollectionModalOpen &&
        selectedCollectionId != null &&
        collectionData && (
          <EditCollectionModal
            isOpen={isEditCollectionModalOpen}
            onClose={() => setIsEditCollectionModalOpen(false)}
            collectionFetchedData={collectionData as Collection}
          />
        )}
      {isCollectionImagesOpen && selectedCollectionId && (
        <CollectionImagesModal
          isOpen={isCollectionImagesOpen}
          onClose={() => setIsCollectionImagesOpen(false)}
          username=''
          collectionId={String(selectedCollectionId)}
        />
      )}
      {isFollowersOpen && (
        <FollowsModal
          isOpen={isFollowersOpen}
          onClose={() => setIsFollowersOpen(false)}
          type='followers'
          users={followersList}
        />
      )}
      {isFollowingOpen && (
        <FollowsModal
          isOpen={isFollowingOpen}
          onClose={() => setIsFollowingOpen(false)}
          type='following'
          users={followingList}
        />
      )}
      <ToastNotification
        variant={toastVariant}
        title={toastMessage.title}
        description={toastMessage.description}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        duration={toastMessage.duration}
      />
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteCollection}
        title='Delete Collection'
        description='Are you sure you want to delete this collection? This action cannot be undone.'
        confirmText='Delete'
        cancelText='Cancel'
        variant='destructive'
      />
      <ConfirmationDialog
        isOpen={isDeleteConfirmImageOpen}
        onClose={() => setIsDeleteConfirmImageOpen(false)}
        onConfirm={confirmDeleteImage}
        title='Delete Image'
        description='Are you sure you want to delete this image? This action cannot be undone.'
        confirmText='Delete'
        cancelText='Cancel'
        variant='destructive'
      />
    </div>
  );
}

export default function Profile() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className='min-h-screen pt-16 flex items-center justify-center'>
            <div className='animate-pulse text-primary'>Loading profile...</div>
          </div>
        }
      >
        <ProfileContent />
      </Suspense>
    </>
  );
}

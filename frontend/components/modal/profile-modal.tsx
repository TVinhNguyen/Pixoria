'use client';

import {
  X,
  LogOut,
  Settings,
  User,
  Heart,
  Bookmark,
  Download,
  Bell,
  User2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export interface ProfileData {
  username: string;
  display_name: string;
  avatar: string;
  bio: string;
  photos: number;
  followers: number;
  following: number;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProfileData | null;
}

export default function ProfileModal({
  isOpen,
  onClose,
  data
}: ProfileModalProps) {
  if (!isOpen || !data) return null;

  const handleLogout = () => {
    localStorage.removeItem('username');
    onClose();
    window.location.reload();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='w-full max-w-md rounded-xl bg-background p-6 shadow-lg'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-bold flex items-center'>
            <User2 className='mr-2 h-5 w-5' />
            Profile
          </h2>
          <Button variant='ghost' size='icon' onClick={onClose}>
            <X className='h-5 w-5' />
          </Button>
        </div>

        <div className='flex flex-col items-center space-y-4'>
          <div className='relative h-24 w-24 overflow-hidden rounded-full border-4 border-primary'>
            <Image
              src={data.avatar || '/placeholder.svg'}
              alt='Profile picture'
              width={96}
              height={96}
              className='h-full w-full object-cover'
            />
          </div>

          <div className='text-center'>
            <h3 className='text-xl font-bold'>{data.display_name}</h3>
            <p className='text-muted-foreground'>@{data.username}</p>
          </div>

          <div className='flex w-full justify-between px-4'>
            <div className='text-center'>
              <p className='text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text'>
                {data.photos}
              </p>
              <p className='text-xs text-muted-foreground'>
                {data.photos > 1 ? 'Photos' : 'Photo'}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text'>
                {data.followers}
              </p>
              <p className='text-xs text-muted-foreground'>
                {data.followers > 1 ? 'Followers' : 'Follower'}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text'>
                {data.following}
              </p>
              <p className='text-xs text-muted-foreground'>Following</p>
            </div>
          </div>

          <div className='w-full space-y-2'>
            <Link href='/profile?tab=photos'>
              <Button variant='outline' className='w-full justify-start'>
                <User className='mr-2 h-4 w-4' />
                View Profile
              </Button>
            </Link>
            <Link href='/profile?tab=collections'>
              <Button variant='outline' className='w-full justify-start'>
                <Bookmark className='mr-2 h-4 w-4' />
                Collections
              </Button>
            </Link>
            <Link href='/profile?tab=likes'>
              <Button variant='outline' className='w-full justify-start'>
                <Heart className='mr-2 h-4 w-4' />
                Likes
              </Button>
            </Link>
            <Link href='/profile?tab=downloads'>
              <Button variant='outline' className='w-full justify-start'>
                <Download className='mr-2 h-4 w-4' />
                Downloads
              </Button>
            </Link>
            <Link href='/settings'>
              <Button variant='outline' className='w-full justify-start'>
                <Settings className='mr-2 h-4 w-4' />
                Settings
              </Button>
            </Link>
            <Button
              variant='destructive'
              className='w-full justify-start'
              onClick={handleLogout}
            >
              <LogOut className='mr-2 h-4 w-4' />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

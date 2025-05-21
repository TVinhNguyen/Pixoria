'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface UserDetails {
  id: number;
  username: string;
  display_name?: string; // Made optional
  avatar?: string; // Made optional
}

interface FollowsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'followers' | 'following';
  users: UserDetails[];
}

export default function FollowsModal({
  isOpen,
  onClose,
  type,
  users
}: FollowsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserDetails[]>(users);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        user =>          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='flex flex-row items-center justify-between border-b pb-2'>
          <DialogTitle className='text-xl font-bold flex items-center'>
            {type === 'followers' ? 'Followers' : 'Following'}
          </DialogTitle>
        </DialogHeader>

        <div className='py-2'>
          <div className='relative'>
            <Input
              placeholder='Search'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-9 bg-muted/50'
            />
            <div className='absolute left-3 top-1/2 -translate-y-1/2'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='text-muted-foreground'
              >
                <circle cx='11' cy='11' r='8'></circle>
                <path d='m21 21-4.3-4.3'></path>
              </svg>
            </div>
          </div>
        </div>

        <ScrollArea className='max-h-[400px] pr-4'>
          <div className='space-y-4'>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  className='flex items-center justify-between'
                >
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-10 w-10 border'>
                      <AvatarImage
                        src={
                          user.avatar || '/placeholder.svg?height=40&width=40'
                        }
                        alt={user.username}
                      />                      <AvatarFallback>
                        {user.display_name ? user.display_name.substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='flex items-center gap-1'>
                        <p className='font-semibold'>{user.username}</p>
                      </div>                      <p className='text-sm text-muted-foreground'>
                        {user.display_name || user.username}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className='flex items-center justify-center h-24'>
                <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

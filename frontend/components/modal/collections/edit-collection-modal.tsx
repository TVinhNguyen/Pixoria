'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { handleUpdateCollection } from '@/lib/api-action/api-collection';
import { DialogTitle } from '@radix-ui/react-dialog';
import ToastNotification from '../message-modal';

export interface Collection {
  id: number;
  name: string;
  cover_image?: string;
  description?: string;
  is_public?: boolean;
}

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionFetchedData: Collection;
}

export default function EditCollectionModal({
  isOpen,
  onClose,
  collectionFetchedData
}: CollectionModalProps) {
  // chỗ này được dùng để set mấy cái toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('success');
  const [toastMessage, setToastMessage] = useState({
    title: '',
    description: '',
    duration: 0
  });

  const [updatedCollection, setUpdatedCollection] = useState<{
    name: string;
    description: string;
    is_public: boolean;
  }>({ name: '', description: '', is_public: true });

  const setNotification = (
    variant: 'success' | 'error' | 'info' | 'warning',
    title: string,
    description: string,
    duration: number
  ) => {
    setToastVariant(variant);
    setToastMessage({ title, description, duration });
    setToastOpen(true);
    setTimeout(() => {
      onClose();
    }, duration - 3000);
  };

  useEffect(() => {
    if (isOpen) {
      setUpdatedCollection({
        name: collectionFetchedData.name,
        description: collectionFetchedData.description || '',
        is_public: collectionFetchedData.is_public || true
      });
    }
  }, [isOpen]);

  const handleSaveChanges = async () => {
    try {
      const response = await handleUpdateCollection(
        collectionFetchedData.id.toString(),
        updatedCollection.name,
        updatedCollection.description,
        updatedCollection.is_public
      );
      if (response != null)
        setNotification(
          'success',
          'Success',
          'Collection updated successfully!',
          5000
        );
      else
        setNotification('error', 'Error', 'Failed to update collection.', 5000);
    } catch (error) {
      setNotification('error', 'Error', 'Failed to update collection.', 5000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md overflow-y-auto max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle className='text-center text-2xl font-bold'>
            {' '}
            Edit Collection{' '}
          </DialogTitle>
        </DialogHeader>
        <div className='py-4'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='collection-name' className='text-base'>
                {' '}
                Collection's name{' '}
              </Label>
              <Input
                id='collection-name'
                placeholder='Eg: My Collection,...'
                value={updatedCollection.name}
                onChange={e =>
                  setUpdatedCollection({
                    ...updatedCollection,
                    name: e.target.value
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='collection-description' className='text-base'>
                {' '}
                Description{' '}
              </Label>
              <Textarea
                id='collection-description'
                placeholder='Describe your new collection (optional)'
                value={updatedCollection.description}
                onChange={e =>
                  setUpdatedCollection({
                    ...updatedCollection,
                    description: e.target.value
                  })
                }
                rows={3}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='public-collection' className='text-base'>
                  {' '}
                  Public{' '}
                </Label>
                <p className='text-sm text-muted-foreground'>
                  Allow other people to view this collection?
                </p>
              </div>
              <Switch
                id='public-collection'
                checked={updatedCollection.is_public}
                onCheckedChange={checked =>
                  setUpdatedCollection({
                    ...updatedCollection,
                    is_public: checked
                  })
                }
              />
            </div>
          </div>

          <div className='mt-8 flex justify-between gap-4'>
            <Button
              variant='outline'
              className='flex-1 py-6'
              onClick={() => onClose()}
            >
              {' '}
              Cancel{' '}
            </Button>
            <Button
              className='flex-1 py-6 bg-green-400 hover:bg-green-500 text-black'
              onClick={handleSaveChanges}
            >
              {' '}
              Save changes{' '}
            </Button>
          </div>
        </div>
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

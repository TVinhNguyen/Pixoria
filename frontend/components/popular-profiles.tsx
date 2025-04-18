"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { getPopularUsers, type UserProfile } from "@/services/user-service"
import { Skeleton } from "@/components/ui/skeleton"

export default function PopularProfiles() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getPopularUsers(3)
        setUsers(data)
      } catch (error) {
        console.error("Error loading popular users:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  if (loading) {
    return (
      <section className="py-12 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Popular Photographers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 px-4 bg-white dark:bg-gray-800">
      <div className="container mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Popular Photographers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.username}`}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="relative h-16 w-16 rounded-full overflow-hidden">
                <Image
                  src={user.avatarUrl || "/placeholder.svg"}
                  alt={user.displayName}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium">{user.displayName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{user.totalPhotos} photos</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

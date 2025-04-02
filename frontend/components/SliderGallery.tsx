"use client"

import { useEffect, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay, EffectCreative } from 'swiper/modules'
import gsap from 'gsap'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-creative'

interface SliderGalleryProps {
  images: Array<{
    id: number
    src: string
    alt: string
    title?: string
    description?: string
  }>
}

export default function SliderGallery({ images }: SliderGalleryProps) {
  const sliderRef = useRef(null)
  const textRef = useRef(null)
  const prevRef = useRef(null)
  const nextRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Animation cải tiến với GSAP
  useEffect(() => {
    // Khởi tạo các phần tử với trạng thái ẩn
    gsap.set(sliderRef.current, { x: '100%', opacity: 0 })
    gsap.set(textRef.current, { y: '50px', opacity: 0 })
    gsap.set([prevRef.current, nextRef.current], { scale: 0, opacity: 0 })
    
    // Timeline animation cải tiến với timing đẹp hơn
    const tl = gsap.timeline({ delay: 0.2 })
    
    // Hiệu ứng slide-in mượt mà cho container
    tl.to(sliderRef.current, {
      x: '0%', 
      opacity: 1, 
      duration: 1.2, 
      ease: 'expo.out' // Sử dụng expo.out cho chuyển động mượt mà hơn
    })
    
    // Animation cho text với hiệu ứng nhảy nhẹ
    tl.to(textRef.current, {
      y: '0', 
      opacity: 1, 
      duration: 0.8, 
      ease: 'back.out(1.7)' // Tăng độ nhảy lên 1.7 cho hiệu ứng đẹp hơn
    }, '-=0.7') // Bắt đầu sớm hơn
    
    // Animation cho các nút điều hướng
    tl.to([prevRef.current, nextRef.current], {
      scale: 1, 
      opacity: 1, 
      duration: 0.5, 
      stagger: 0.15, 
      ease: 'back.out(2.5)' // Tăng độ nhảy cho nút
    }, '-=0.4') // Bắt đầu sớm hơn
    
    // Xóa animations khi component unmount
    return () => {
      tl.kill()
    }
  }, [])

  // Xử lý sự kiện swiper chuyển slide với hiệu ứng hiện chữ từ từ
  const handleSlideChange = (swiper: any) => {
    setActiveIndex(swiper.realIndex);
    
    // Tìm container text của slide hiện tại
    const currentTextElement = document.querySelector(`.slide-text-${swiper.realIndex}`);
    
    if (currentTextElement) {
      // Tìm các phần tử con bên trong để tạo hiệu ứng staggered
      const titleElement = currentTextElement.querySelector('.slide-title');
      const descElement = currentTextElement.querySelector('.slide-desc');
      
      // Reset trạng thái trước khi animate
      gsap.set([titleElement, descElement], { 
        y: '40px', 
        opacity: 0 
      });
      
      // Tạo staggered animation - hiện từng phần tử một, từ từ
      gsap.to([titleElement, descElement], {
        y: '0',
        opacity: 1,
        duration: 0.8,
        stagger: 0.15, // Delay giữa các phần tử
        ease: 'power2.out',
        delay: 0.3, // Đợi một chút sau khi slide thay đổi
      });
    }
  };

  if (!images || images.length === 0) {
    return null
  }

  return (
    <div className="relative overflow-hidden">
      <div ref={sliderRef} className="w-full will-change-transform">
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectCreative]}
          spaceBetween={0}
          slidesPerView={1}
          pagination={{ 
            clickable: true,
            dynamicBullets: true,
            dynamicMainBullets: 3,
          }}
          autoplay={{ 
            delay: 6000,
            disableOnInteraction: false 
          }}
          effect="creative"
          creativeEffect={{
            prev: {
              translate: ['-20%', 0, -1],
              opacity: 0.5,
              scale: 0.95,
            },
            next: {
              translate: ['100%', 0, 0],
              opacity: 0,
              scale: 0.95,
            },
          }}
          loop={true}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onBeforeInit={(swiper) => {
            // @ts-ignore
            swiper.params.navigation.prevEl = prevRef.current
            // @ts-ignore
            swiper.params.navigation.nextEl = nextRef.current
          }}
          onSlideChange={handleSlideChange}
          className="h-[500px] md:h-[600px] w-full rounded-xl overflow-hidden shadow-2xl"
        >
          {images.map((image, index) => (
            <SwiperSlide key={image.id} className="relative overflow-hidden">
              {/* Background Image */}
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                className="object-cover transition-transform duration-700 hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.log(`Ảnh lỗi: ${image.src}, chuyển sang ảnh dự phòng`);
                  target.src = "/placeholder.svg";
                }}
              />
              
              {/* Gradient Overlay - Cải tiến với gradient phức tạp hơn */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
              
              {/* Content Container - Đã loại bỏ indicator số và các nút */}
              <div 
                className={`slide-text-${index} absolute bottom-0 left-0 p-8 md:p-10 text-white z-10 w-full max-w-4xl transition-opacity duration-500`}
                ref={index === 0 ? textRef : null}
              >
                {/* Title với hiệu ứng hiện chữ từ từ */}
                {image.title && (
                  <h3 className="slide-title text-2xl md:text-3xl font-extrabold mb-2 tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                    {image.title}
                  </h3>
                )}
                
                {/* Description với hiệu ứng hiện chữ từ từ */}
                {image.description && (
                  <p className="slide-desc text-base md:text-lg text-gray-200 max-w-2xl font-medium leading-relaxed">
                    {image.description}
                  </p>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* Previous Button */}
        <button 
          ref={prevRef}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-xl"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        
        {/* Next Button */}
        <button 
          ref={nextRef}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-xl"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  )
}
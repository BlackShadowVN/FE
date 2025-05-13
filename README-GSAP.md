# Tích hợp GSAP vào dự án E-Shop

GSAP (GreenSock Animation Platform) đã được tích hợp vào dự án E-Shop để tạo các hiệu ứng animation mượt mà, chuyên nghiệp. 

## Các thành phần đã tích hợp

### 1. GSAP Provider
- Tạo context chứa GSAP để sử dụng trong toàn bộ ứng dụng
- Đăng ký plugin ScrollTrigger để tạo hiệu ứng khi cuộn
- Hook `useGSAP` để truy cập instance GSAP từ các component

### 2. Components Animation
- **FadeInView**: Component tạo hiệu ứng fade-in khi phần tử xuất hiện trong viewport
- **Parallax**: Component tạo hiệu ứng parallax khi cuộn trang
- **TextFX**: Component tạo hiệu ứng animation cho văn bản (characters, words, lines)

### 3. Header Animation
- Animation khi trang tải xong
- Hiệu ứng ẩn/hiện khi cuộn trang
- Animation cho logo và các mục menu
- Chuyển đổi mượt mà giữa các trạng thái

### 4. BannerCarousel Animation
- Hiệu ứng chuyển đổi mượt mà giữa các banner
- Hiệu ứng hiển thị nội dung văn bản trên banner
- Sử dụng timeline để điều khiển trình tự animation

### 5. Danh mục sản phẩm và sản phẩm nổi bật
- Hiệu ứng fade-in khi cuộn đến các danh mục
- Animation theo trình tự cho các thẻ sản phẩm
- Hiệu ứng hover cho hình ảnh sản phẩm

### 6. Footer Animation
- Hiệu ứng hiển thị theo trình tự khi cuộn đến footer
- Animation nút mạng xã hội
- Hiệu ứng fade-in cho nội dung

## Hướng dẫn sử dụng

### Để sử dụng các components animation:

```jsx
import { FadeInView, Parallax, TextFX } from "@/components/animation";

// FadeInView - hiệu ứng fade in khi cuộn
<FadeInView delay={0.2} direction="up">
  <div>Nội dung sẽ có hiệu ứng fade-in từ dưới lên</div>
</FadeInView>

// Parallax - hiệu ứng parallax khi cuộn
<Parallax speed={0.5}>
  <div>Phần tử này sẽ di chuyển với tốc độ khác so với phần còn lại của trang</div>
</Parallax>

// TextFX - hiệu ứng chữ
<TextFX effect="words" stagger={0.03}>
  <h2>Tiêu đề với hiệu ứng animation</h2>
</TextFX>
```

### Tùy chỉnh GSAP trong component tùy chỉnh:

```jsx
import { useGSAP } from "@/components/gsap-provider";
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";

function MyComponent() {
  const ref = useRef(null);
  const { gsap } = useGSAP();
  
  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return;
    
    // Tạo animation với GSAP
    gsap.to(ref.current, {
      opacity: 1,
      y: 0,
      duration: 1,
      scrollTrigger: {
        trigger: ref.current,
        start: "top bottom-=100",
        toggleActions: "play none none none"
      }
    });
  }, [gsap]);
  
  return <div ref={ref}>Nội dung với animation</div>;
}
```

## Các plugin đã sử dụng
- **ScrollTrigger**: Kích hoạt animation khi cuộn đến các phần tử

## Tối ưu hóa
- Sử dụng `useIsomorphicLayoutEffect` để tránh cảnh báo khi sử dụng GSAP trong SSR
- Các components tái sử dụng để dễ dàng áp dụng animation
- Tự động cleanup animation để tránh memory leak 
"use client"

import { useState, useEffect, Suspense, useRef, useCallback, startTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useSearchParams, useRouter } from "next/navigation"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { ChevronDown, Search, ShoppingCart } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { FadeInView, BatchFadeIn } from "@/components/animation"
import { useGSAP } from "@/components/gsap-provider"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"

interface SearchParams {
  category?: string
  search?: string
  sort?: string
  name?: string
}

// Hàm tiện ích để đảm bảo việc so sánh ID nhất quán
function compareIds(id1: any, id2: any): boolean {
  // Chuyển đổi cả hai ID thành chuỗi và loại bỏ khoảng trắng
  const normalizedId1 = String(id1).trim();
  const normalizedId2 = String(id2).trim();
  return normalizedId1 === normalizedId2;
}

// Fallback data for when the API fails
const FALLBACK_CATEGORIES = [
  {
    id: "14",
    name: "Aether Tools",
    description: "Công cụ Aether sẽ nâng cấp vũ khí bạn đang cầm",
    total_products: "4",
  },
  {
    id: "15",
    name: "Aetherium",
    description: "Tinh thể Aetherium thô sẽ giúp vũ khí hiện tại của bạn lên Cấp độ I/II/III",
    total_products: "2",
  },
  {
    id: "17",
    name: "Ammo Mods",
    description:
      "Ammo Mods nhìn chung khá đơn giản, nhưng lưu ý chính là bạn chỉ có thể trang bị một Ammo Mods trên một vũ khí tại một thời điểm.",
    total_products: "5",
  },
  {
    id: "19",
    name: "Classified Schematics",
    description:
      "Classified Schematics là sơ đồ Acquisition cấp cao có thể khá khó kiếm nhưng rất đáng công sức tìm kiếm.",
    total_products: "8",
  },
]

// Client Component riêng biệt cho phần sắp xếp
function SortSelector({ currentSort }: { currentSort?: string }) {
  const router = useRouter();
  
  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('sort', value);
    router.push(`/products?${params.toString()}`);
  };
  
  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="sort">
      <AccordionItem value="sort">
        <AccordionTrigger className="font-medium">
          Sắp xếp theo
        </AccordionTrigger>
        <AccordionContent>
          <div className="pt-2">
            <Select 
              defaultValue={currentSort || "newest"} 
              onValueChange={handleSortChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="price-asc">Giá: Thấp đến cao</SelectItem>
                <SelectItem value="price-desc">Giá: Cao đến thấp</SelectItem>
                <SelectItem value="name-asc">Tên: A-Z</SelectItem>
                <SelectItem value="name-desc">Tên: Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Client Component cho phần tìm kiếm
function SearchInput({ currentSearch }: { currentSearch?: string }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(currentSearch || "");
  
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== currentSearch) {
        const params = new URLSearchParams(window.location.search);
        
        if (searchTerm) {
          params.set('search', searchTerm);
        } else if (params.has('search')) {
          params.delete('search');
        }
        
        router.push(`/products?${params.toString()}`);
      }
    }, 500); // Debounce 500ms để tránh quá nhiều request khi người dùng đang gõ
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, currentSearch, router]);

  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="search">
      <AccordionItem value="search">
        <AccordionTrigger className="font-medium">
          Tìm kiếm
        </AccordionTrigger>
        <AccordionContent>
          <div className="pt-2">
            <Input
              type="search"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Client component cho danh mục
function CategoryFilterClient({ currentCategory, categories }: { currentCategory?: string, categories: any[] }) {
  const router = useRouter();
  
  const handleCategoryClick = (categoryId?: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams(window.location.search);
    
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    
    router.push(`/products?${params.toString()}`);
  };
  
  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="categories">
      <AccordionItem value="categories">
        <AccordionTrigger className="font-medium">
          Danh mục sản phẩm
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pt-2">
            <a
              href="/products"
              onClick={handleCategoryClick()}
              className={`block px-3 py-2 rounded-md ${!currentCategory ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              Tất cả sản phẩm
            </a>
            {categories.map((category: any) => {
              return (
                <a
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  onClick={handleCategoryClick(category.id)}
                  className={`block px-3 py-2 rounded-md ${
                    currentCategory && compareIds(currentCategory, category.id)
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  }`}
                >
                  {category.name}
                  <span className="text-xs ml-2">({category.total_products})</span>
                </a>
              )
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Client component cho lưới sản phẩm
function ProductGridClient({ products }: { products: any[] }) {
  if (!products.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy sản phẩm</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="h-full flex flex-col">
          <CardHeader className="p-0">
            <div className="relative h-48 w-full">
              <Image
                src={product.main_image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover rounded-t-lg"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow">
            <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
            <p className="text-primary font-bold mt-2">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                Number.parseFloat(product.base_price),
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Link href={`/products/${product.id}`} className="w-full">
              <Button variant="default" className="w-full">
                Xem chi tiết
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

// Category fetcher component
function CategoryFetcher({ currentCategory }: { currentCategory?: string }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("https://thanhbinhnguyen.id.vn/restful/categories", {
          next: { revalidate: 3600 },
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          console.error("Failed to fetch categories:", res.status, res.statusText);
          setCategories(FALLBACK_CATEGORIES);
          return;
        }

        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setCategories(data.status === "success" ? data.data : FALLBACK_CATEGORIES);
        } catch (parseError) {
          console.error("Error parsing categories JSON:", parseError);
          setCategories(FALLBACK_CATEGORIES);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <Skeleton className="h-40 w-full" />;
  }

  return <CategoryFilterClient currentCategory={currentCategory} categories={categories} />;
}

// Products fetcher component
function ProductsFetcher({ searchParams }: { searchParams: SearchParams }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("https://thanhbinhnguyen.id.vn/restful/products?page=1&limit=9999", {
          next: { revalidate: 3600 },
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          console.error("Failed to fetch products:", res.status, res.statusText);
          setProducts([]);
          return;
        }

        const text = await res.text();
        try {
          const data = JSON.parse(text);
          
          if (data.status === "success") {
            let filteredProducts = data.data.products;
            
            // Filter by category if provided
            if (searchParams.category) {
              const categoryId = searchParams.category;
              filteredProducts = filteredProducts.filter((product: any) => {
                return compareIds(product.category_id, categoryId);
              });
            }
    
            // Filter by search term if provided
            if (searchParams.search) {
              const searchTerm = searchParams.search.toLowerCase();
              filteredProducts = filteredProducts.filter(
                (product: any) =>
                  product.name.toLowerCase().includes(searchTerm) || 
                  product.description.toLowerCase().includes(searchTerm),
              );
            }
            
            // Filter by name if provided
            if (searchParams.name) {
              const nameTerm = searchParams.name.toLowerCase();
              filteredProducts = filteredProducts.filter(
                (product: any) => product.name.toLowerCase().includes(nameTerm)
              );
            }
    
            // Sort products based on sort parameter
            const sortParam = searchParams.sort || "newest";
            
            switch (sortParam) {
              case "newest":
                filteredProducts.sort((a: any, b: any) => {
                  const dateA = new Date(a.created_at).getTime();
                  const dateB = new Date(b.created_at).getTime();
                  return dateB - dateA;
                });
                break;
                
              case "price-asc":
                filteredProducts.sort((a: any, b: any) => 
                  Number.parseFloat(a.base_price) - Number.parseFloat(b.base_price));
                break;
                
              case "price-desc":
                filteredProducts.sort((a: any, b: any) => 
                  Number.parseFloat(b.base_price) - Number.parseFloat(a.base_price));
                break;
                
              case "name-asc":
                filteredProducts.sort((a: any, b: any) => a.name.localeCompare(b.name));
                break;
                
              case "name-desc":
                filteredProducts.sort((a: any, b: any) => b.name.localeCompare(a.name));
                break;
                
              default:
                filteredProducts.sort((a: any, b: any) => {
                  const dateA = new Date(a.created_at).getTime();
                  const dateB = new Date(b.created_at).getTime();
                  return dateB - dateA;
                });
            }
            
            setProducts(filteredProducts);
          } else {
            setProducts([]);
          }
        } catch (parseError) {
          console.error("Error parsing products JSON:", parseError);
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
      </div>
    );
  }

  return <ProductGridClient products={products} />;
}

function ProductSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="p-0">
        <Skeleton className="h-48 w-full rounded-t-lg" />
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  )
}

// Client Component cho thanh tìm kiếm tên sản phẩm
function ProductNameSearch({ currentName }: { currentName?: string }) {
  const router = useRouter();
  const [productName, setProductName] = useState(currentName || "");
  
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (productName !== currentName) {
        const params = new URLSearchParams(window.location.search);
        
        if (productName) {
          params.set('name', productName);
        } else if (params.has('name')) {
          params.delete('name');
        }
        
        router.push(`/products?${params.toString()}`);
      }
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(debounceTimer);
  }, [productName, currentName, router]);
  
  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="nameSearch">
      <AccordionItem value="nameSearch">
        <AccordionTrigger className="font-medium">
          Tìm theo tên sản phẩm
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Nhập tên sản phẩm..."
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Client Component wrapper với Suspense
function ProductsPageClient() {
  // Sử dụng hook useSearchParams để lấy search params ở client-side
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;
  const sort = searchParams.get('sort') || undefined;
  const name = searchParams.get('name') || undefined;

  // Tạo đối tượng searchParams để truyền cho các component
  const searchParamsObj: SearchParams = {
    category,
    search,
    sort,
    name
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Sản phẩm</h1>

      <div className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="sticky top-4 space-y-6 max-h-[calc(100vh-2rem)] overflow-y-auto pr-2 pb-4">
            <CategoryFetcher currentCategory={category} />
            <SortSelector currentSort={sort} />
            <SearchInput currentSearch={search} />
            <ProductNameSearch currentName={name} />
          </div>
        </div>

        <div className="md:col-span-3">
          <ProductsFetcher searchParams={searchParamsObj} />
        </div>
      </div>
    </div>
  );
}

// Trang chính - sử dụng Suspense để bọc lại Client Component
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageLoading />}>
      <ProductsPageClient />
            </Suspense>
  );
}

// Loading UI cho trang products
function ProductsPageLoading() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Sản phẩm</h1>
      <div className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { gsap } = useGSAP();
  
  // Hover animation cho card
  useIsomorphicLayoutEffect(() => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const image = card.querySelector('.product-image');
    
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        y: -5,
        duration: 0.3,
        ease: 'power1.out',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      });
      
      if (image) {
        gsap.to(image, {
          scale: 1.05,
          duration: 0.4,
          ease: 'power1.out'
        });
      }
    });
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        y: 0,
        duration: 0.3,
        ease: 'power1.out',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      });
      
      if (image) {
        gsap.to(image, {
          scale: 1,
          duration: 0.4,
          ease: 'power1.out'
        });
      }
    });
  }, [gsap]);

  return (
    <Card ref={cardRef} className="h-full hover:shadow-md transition-all">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={product.main_image || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover rounded-t-lg product-image"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
        <p className="text-primary font-bold mt-2">
          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
            Number.parseFloat(product.base_price),
          )}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col space-y-2">
        <Link href={`/products/${product.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            Xem chi tiết
          </Button>
        </Link>
        <Button
          onClick={() => {}} // Placeholder
          className="w-full"
          variant="default"
        >
          Thêm vào giỏ hàng
        </Button>
      </CardFooter>
    </Card>
  )
}

function Products({ 
  products = [], 
  totalPages = 1, 
  categories = [] 
}: { 
  products: any[]; 
  totalPages: number; 
  categories: any[] 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { gsap } = useGSAP();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 20000000]);
  const [sortOrder, setSortOrder] = useState<string>("name_asc");
  const [page, setPage] = useState<number>(1);

  // Animation cho danh sách sản phẩm
  useIsomorphicLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const title = container.querySelector('h1');
    const filtersTitle = container.querySelector('.filters-title');
    const filterItems = container.querySelectorAll('.filter-item');
    
    // Timeline cho animation
    const tl = gsap.timeline();
    
    // Animation cho tiêu đề
    if (title) {
      tl.fromTo(
        title,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
    
    // Animation cho phần tiêu đề filter
    if (filtersTitle) {
      tl.fromTo(
        filtersTitle,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
        "-=0.3"
      );
    }
    
    // Animation cho các filter item
    if (filterItems.length) {
      tl.fromTo(
        filterItems,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'power2.out' },
        "-=0.2"
      );
    }
  }, [gsap]);

  // Khởi tạo state từ URL
  useEffect(() => {
    if (!searchParams) return;
    
    const query = searchParams.get("query") || "";
    const cats = searchParams.get("categories")?.split(",") || [];
    const minPrice = Number(searchParams.get("minPrice") || 0);
    const maxPrice = Number(searchParams.get("maxPrice") || 20000000);
    const sort = searchParams.get("sort") || "name_asc";
    const currentPage = Number(searchParams.get("page") || 1);

    setSearchQuery(query);
    setSelectedCategories(cats);
    setPriceRange([minPrice, maxPrice]);
    setSortOrder(sort);
    setPage(currentPage);
  }, [searchParams]);

  // Thay đổi URL khi áp dụng bộ lọc
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set("query", searchQuery);
    if (selectedCategories.length > 0) params.set("categories", selectedCategories.join(","));
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < 20000000) params.set("maxPrice", priceRange[1].toString());
    if (sortOrder) params.set("sort", sortOrder);
    params.set("page", "1");

    router.push(`/products?${params.toString()}`);
  }, [searchQuery, selectedCategories, priceRange, sortOrder, router]);

  // Reset bộ lọc
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategories([]);
    setPriceRange([0, 20000000]);
    setSortOrder("name_asc");
    router.push("/products");
  }, [router]);

  // Đổi trang
  const changePage = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", newPage.toString());
    router.push(`/products?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div ref={containerRef} className="container px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Sản phẩm</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-4 filters-title">Lọc sản phẩm</h2>
            <div className="space-y-4">
              <div className="filter-item">
                <h3 className="text-sm font-medium mb-3">Danh mục</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories([...selectedCategories, category.id])
                          } else {
                            setSelectedCategories(selectedCategories.filter((id) => id !== category.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`category-${category.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="filter-item">
                <h3 className="text-sm font-medium mb-3">Giá</h3>
                <div className="space-y-4">
                  <Slider
                    defaultValue={[priceRange[0], priceRange[1]]}
                    min={0}
                    max={20000000}
                    step={100000}
                    value={[priceRange[0], priceRange[1]]}
                    onValueChange={(value) => setPriceRange([value[0], value[1]])}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(priceRange[0])}
                    </span>
                    <span className="text-sm">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(priceRange[1])}
                    </span>
                  </div>
                </div>
              </div>

              <div className="filter-item">
                <h3 className="text-sm font-medium mb-3">Sắp xếp theo</h3>
                <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                    <SelectValue placeholder="Chọn thứ tự sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                    <SelectItem value="name_asc">Tên (A-Z)</SelectItem>
                    <SelectItem value="name_desc">Tên (Z-A)</SelectItem>
                    <SelectItem value="price_asc">Giá (Thấp - Cao)</SelectItem>
                    <SelectItem value="price_desc">Giá (Cao - Thấp)</SelectItem>
              </SelectContent>
            </Select>
          </div>

              <Button className="w-full filter-item" onClick={applyFilters}>
                Áp dụng bộ lọc
                </Button>
              </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="mb-6 grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Tìm kiếm sản phẩm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={applyFilters}>Tìm kiếm</Button>
            </div>
          </div>

          {products.length > 0 ? (
            <BatchFadeIn 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              stagger={0.05}
              duration={0.5}
              distance={20}
              direction="up"
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </BatchFadeIn>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
              <Button className="mt-4" variant="outline" onClick={resetFilters}>
                Xóa bộ lọc
              </Button>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => changePage(page - 1)}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "outline"}
                    onClick={() => changePage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={() => changePage(page + 1)}
                  disabled={page === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

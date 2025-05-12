"use client"

import { useState, useEffect, Suspense } from "react"
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
import { ChevronDown, Search } from "lucide-react"

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

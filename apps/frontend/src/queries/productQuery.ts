import { QueryOptions } from "@tanstack/react-query";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "in_stock" | "out_of_stock" | "low_stock";
}


export const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch("/api/products");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}

export const productQueryOptions: QueryOptions<Product[], Error> = {
  queryKey: ["products"],
  queryFn: () => fetchProducts(),
};
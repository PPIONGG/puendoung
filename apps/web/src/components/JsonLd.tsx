import { useEffect } from "react";

interface ProductJsonLdProps {
  name: string;
  description?: string;
  image?: string;
  price: number;
  currency?: string;
  availability?: string;
  slug: string;
}

export function ProductJsonLd({ name, description, image, price, currency = "THB", availability = "InStock", slug }: ProductJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || name,
    image: image || undefined,
    offers: {
      "@type": "Offer",
      price: (price / 100).toFixed(2),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url: `${window.location.origin}/products/${slug}`,
    },
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    script.id = "jsonld-product";
    const existing = document.getElementById("jsonld-product");
    if (existing) existing.remove();
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [name, description, image, price, currency, availability, slug]);

  return null;
}

import { useEffect } from "react";

export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = title ? `${title} | เพื่อนด้วง` : originalTitle;

    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      const originalDesc = meta?.content;
      if (meta) meta.content = description;

      return () => {
        document.title = originalTitle;
        if (meta && originalDesc) meta.content = originalDesc;
      };
    }

    return () => {
      document.title = originalTitle;
    };
  }, [title, description]);
}

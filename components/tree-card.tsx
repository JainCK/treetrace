import { TreeWithImages } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Leaf } from "lucide-react";

interface TreeCardProps {
  tree: TreeWithImages;
}

export function TreeCard({ tree }: TreeCardProps) {
  const primaryImage = tree.tree_images[0]?.image_url;

  return (
    <Link href={`/trees/${tree.id}`}>
      <Card className="group hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          {primaryImage ? (
            <div className="relative w-full h-56 overflow-hidden">
              <Image
                src={primaryImage || "/placeholder.svg"}
                alt={tree.common_name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              {tree.is_premium && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                  Premium
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-56 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <div className="text-center">
                <Leaf className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                <span className="text-blue-600 font-medium">No Image</span>
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-xl text-slate-800 leading-tight group-hover:text-blue-700 transition-colors line-clamp-2">
                {tree.common_name}
              </h3>
            </div>

            <p className="text-blue-600 text-sm font-medium italic mb-4 line-clamp-1">
              {tree.scientific_name}
            </p>

            {tree.description && (
              <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 mb-4">
                {tree.description}
              </p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-blue-100">
              {tree.latitude && tree.longitude && (
                <div className="flex items-center text-blue-500 text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>Location Available</span>
                </div>
              )}

              <div className="text-right">
                <span className="text-blue-600 text-sm font-semibold group-hover:text-blue-700 transition-colors">
                  View Details →
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

import { TreeWithImages } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

interface TreeCardProps {
  tree: TreeWithImages;
}

export function TreeCard({ tree }: TreeCardProps) {
  const primaryImage = tree.tree_images[0]?.image_url;

  return (
    <Link href={`/trees/${tree.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          {primaryImage ? (
            <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
              <Image
                src={primaryImage}
                alt={tree.common_name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-48 mb-4 bg-gray-200 rounded-md flex items-center justify-center">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
          <h3 className="font-semibold text-lg mb-1">{tree.common_name}</h3>
          <p className="text-gray-600 text-sm italic">{tree.scientific_name}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

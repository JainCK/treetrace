"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TreeWithImages } from "@/lib/types";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

interface TreeDetailClientProps {
  tree: TreeWithImages;
}

export function TreeDetailClient({ tree }: TreeDetailClientProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this tree? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      // Delete images from storage
      const deletePromises = tree.tree_images.map(async (img) => {
        // Correct path extraction: assuming URL is like https://[project-ref].supabase.co/storage/v1/object/public/treeimages/userId/treeId/fileName.jpg
        // We need 'userId/treeId/fileName.jpg' for .remove()
        const pathSegments = img.image_url.split("/");
        // Find the index of 'public' and then slice to get path after bucket name
        const path = pathSegments
          .slice(pathSegments.indexOf("public") + 2)
          .join("/");

        return supabase.storage.from("treeimages").remove([path]); // CORRECTED: Bucket name "treeimages"
      });
      await Promise.all(deletePromises);

      // Delete tree (cascade will delete tree_images records if set up correctly)
      const { error } = await supabase
        .from("trees")
        .delete()
        .eq("id", tree.id)
        .eq("user_id", tree.user_id); // Added user_id for RLS safety

      if (error) {
        console.error("Error deleting tree:", error);
        throw error;
      }

      router.push("/dashboard"); // Redirect after successful deletion
    } catch (error) {
      console.error("Failed to delete tree:", error);
      alert("Failed to delete tree. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getMapUrl = () => {
    if (tree.latitude && tree.longitude) {
      return `https://maps.google.com/maps?q=${tree.latitude},${tree.longitude}&z=15&output=embed`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Tree Details</h1>
            <div className="flex space-x-2">
              <Link href={`/trees/edit/${tree.id}`}>
                <Button variant="outline">Edit</Button>
              </Link>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="md:col-span-1">
              <div className="relative h-64 md:h-96 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {tree.tree_images && tree.tree_images.length > 0 ? (
                  <Image
                    src={tree.tree_images[0].image_url}
                    alt={tree.common_name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Added sizes prop for performance
                    style={{ objectFit: "cover" }} // Ensures image covers the container
                    priority // Optional: Use if this is the LCP image
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-200">
                    <span className="text-lg">No Image Available</span>
                  </div>
                )}
              </div>

              {/* If you have multiple images and want a carousel/gallery, implement it here */}
              {/* Example for a simple grid of additional images */}
              {tree.tree_images && tree.tree_images.length > 1 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {tree.tree_images.slice(1).map((img, index) => (
                    <div
                      key={index}
                      className="relative h-24 w-full rounded-md overflow-hidden bg-gray-100"
                    >
                      <Image
                        src={img.image_url}
                        alt={`${tree.common_name} ${index + 2}`}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw" // Adjust sizes for smaller thumbnails
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="md:col-span-1 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{tree.common_name}</h2>
                <p className="text-gray-600 italic">{tree.scientific_name}</p>
              </div>

              {tree.facts && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Facts</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {tree.facts}
                  </p>
                </div>
              )}

              {tree.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Description</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {tree.description}
                  </p>
                </div>
              )}

              {/* Map */}
              {tree.latitude && tree.longitude && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Location</h2>
                  <Card>
                    <CardContent className="p-4">
                      <div className="mb-4">
                        <p>
                          <strong>Latitude:</strong> {tree.latitude}
                        </p>
                        <p>
                          <strong>Longitude:</strong> {tree.longitude}
                        </p>
                      </div>
                      <div className="w-full h-64 rounded-md overflow-hidden">
                        <iframe
                          src={getMapUrl()!}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          marginHeight={0}
                          marginWidth={0}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

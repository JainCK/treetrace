"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TreeWithImages } from "@/lib/types";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Leaf,
  Award,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface TreeDetailClientProps {
  tree: TreeWithImages;
  isAdmin: boolean;
}

export function TreeDetailClient({ tree, isAdmin }: TreeDetailClientProps) {
  const [loading, setLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
      const deletePromises = tree.tree_images.map(async (img) => {
        const pathSegments = img.image_url.split("/");
        const path = pathSegments
          .slice(pathSegments.indexOf("public") + 2)
          .join("/");

        return supabase.storage.from("treeimages").remove([path]);
      });
      await Promise.all(deletePromises);

      const { error } = await supabase.from("trees").delete().eq("id", tree.id);

      if (error) {
        console.error("Error deleting tree:", error);
        throw error;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete tree:", error);
      alert("Failed to delete tree. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getMapUrl = () => {
    if (tree.latitude && tree.longitude) {
      return `https://maps.google.com/maps?q=${tree.latitude},${tree.longitude}&z=16&output=embed`;
    }
    return null;
  };

  const renderCareTimeline = (timeline: any) => {
    if (!timeline || !Array.isArray(timeline) || timeline.length === 0) {
      return (
        <p className="text-slate-500 text-sm">
          No care timeline data available.
        </p>
      );
    }
    return (
      <div className="space-y-3">
        {timeline.map((item: any, index: number) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
          >
            <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-blue-800">{item.date}</span>
              <p className="text-slate-700 text-sm mt-1">{item.event}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBoxedList = (text: string | null | undefined) => {
    if (!text)
      return <p className="text-slate-500 text-sm">No data available.</p>;
    const items = text.split("\n").filter((item) => item.trim() !== "");
    if (items.length === 0)
      return <p className="text-slate-500 text-sm">No data available.</p>;

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 text-sm font-medium px-4 py-2 rounded-full shadow-sm border border-blue-200 hover:shadow-md transition-shadow"
          >
            {item.trim()}
          </span>
        ))}
      </div>
    );
  };

  const openImageModal = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const navigateImageModal = (direction: "prev" | "next") => {
    if (!tree.tree_images || tree.tree_images.length === 0) return;
    const totalImages = tree.tree_images.length;
    let newIndex = currentImageIndex;

    if (direction === "prev") {
      newIndex = (currentImageIndex - 1 + totalImages) % totalImages;
    } else {
      newIndex = (currentImageIndex + 1) % totalImages;
    }
    setCurrentImageIndex(newIndex);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>

          <div className="flex justify-between items-center">
            {tree.is_premium && (
              <div className="inline-flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                <Award className="h-4 w-4 mr-1" />
                Premium Tree
              </div>
            )}

            {isAdmin && (
              <div className="flex space-x-2">
                <Link href={`/trees/${tree.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {loading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            {tree.tree_images && tree.tree_images.length > 0 ? (
              <>
                <div className="relative h-80 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                  <Image
                    src={tree.tree_images[0].image_url || "/placeholder.svg"}
                    alt={tree.common_name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>

                {/* Smaller thumbnail images */}
                {tree.tree_images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {tree.tree_images.slice(1, 5).map((img, index) => (
                      <div
                        key={index + 1}
                        className="relative h-16 rounded-md overflow-hidden bg-gray-100 cursor-pointer hover:opacity-75 transition-opacity"
                        onClick={() => openImageModal(index + 1)}
                      >
                        <Image
                          src={img.image_url || "/placeholder.svg"}
                          alt={`${tree.common_name} ${index + 2}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Leaf className="h-12 w-12 mx-auto mb-2" />
                  <p>No images available</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Tree Details */}
          <div className="space-y-6">
            {/* Tree Names and Description Combined */}
            <Card>
              <CardHeader>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {tree.common_name}
                  </h1>
                  <p className="text-lg text-gray-600 italic mb-4">
                    {tree.scientific_name}
                  </p>
                </div>
              </CardHeader>
              {tree.description && (
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {tree.description}
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </div>

        {/* Location Info - Full Width */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tree.location && (
              <div>
                <span className="font-medium text-gray-600">Location: </span>
                <span className="text-gray-900">{tree.location}</span>
              </div>
            )}
            {tree.landmark && (
              <div>
                <span className="font-medium text-gray-600">Landmark: </span>
                <span className="text-gray-900">{tree.landmark}</span>
              </div>
            )}
            {tree.carbon_footprint && (
              <div>
                <span className="font-medium text-gray-600">
                  Carbon Absorption:{" "}
                </span>
                <span className="text-green-600 font-semibold">
                  {tree.carbon_footprint} kg CO₂/year
                </span>
              </div>
            )}
            {tree.latitude && tree.longitude && (
              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">
                      Latitude:{" "}
                    </span>
                    <span className="text-gray-900 font-mono">
                      {tree.latitude}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Longitude:{" "}
                    </span>
                    <span className="text-gray-900 font-mono">
                      {tree.longitude}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Facts Section - Full Width */}
        {tree.facts && tree.facts.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Interesting Facts</CardTitle>
            </CardHeader>
            <CardContent>{renderBoxedList(tree.facts as string)}</CardContent>
          </Card>
        )}

        {/* Premium Details Section - Full Width when available */}
        {tree.is_premium && (
          <Card className="mt-8 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-xl text-amber-800 flex items-center">
                <Award className="h-6 w-6 mr-2" />
                Premium Tree Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tree.age && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-amber-700">Age</h4>
                    <p className="text-amber-900 text-lg font-semibold">
                      {tree.age} years old
                    </p>
                  </div>
                )}

                {tree.biological_conditions && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-amber-700">
                      Biological Conditions
                    </h4>
                    <p className="text-amber-900 leading-relaxed text-sm">
                      {tree.biological_conditions}
                    </p>
                  </div>
                )}

                {tree.care_timeline && (
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="font-medium text-amber-700 text-lg">
                      Care Timeline
                    </h4>
                    {renderCareTimeline(tree.care_timeline)}
                  </div>
                )}

                {tree.benefits && tree.benefits.length > 0 && (
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="font-medium text-amber-700 text-lg">
                      Environmental Benefits
                    </h4>
                    {renderBoxedList(tree.benefits as string)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Section */}
        {tree.latitude && tree.longitude && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Map Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full h-80 rounded-b-lg overflow-hidden">
                <iframe
                  src={getMapUrl()!}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  aria-hidden="false"
                  tabIndex={0}
                  className="w-full h-full"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && tree.tree_images && tree.tree_images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={closeImageModal}
        >
          <div
            className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/20"
              size="icon"
            >
              <X className="h-6 w-6" />
            </Button>

            <div className="relative w-[90vw] h-[80vh] flex items-center justify-center">
              <Image
                src={
                  tree.tree_images[currentImageIndex].image_url ||
                  "/placeholder.svg"
                }
                alt={tree.common_name}
                fill
                style={{ objectFit: "contain" }}
                className="rounded-lg"
                sizes="90vw"
              />
            </div>

            {tree.tree_images.length > 1 && (
              <>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImageModal("prev");
                  }}
                  className="absolute left-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/20"
                  size="icon"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImageModal("next");
                  }}
                  className="absolute right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/20"
                  size="icon"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} of {tree.tree_images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

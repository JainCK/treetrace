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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section with Images */}
      <div className="relative">
        {tree.tree_images && tree.tree_images.length > 0 ? (
          <div className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
            <Image
              src={tree.tree_images[0].image_url || "/placeholder.svg"}
              alt={tree.common_name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Header Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center text-white/90 hover:text-white transition-colors mb-4 bg-black/20 backdrop-blur-sm px-3 py-2 rounded-full"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      <span>Back to Dashboard</span>
                    </Link>

                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
                      {tree.common_name}
                    </h1>
                    <p className="text-blue-100 italic text-xl md:text-2xl font-light">
                      {tree.scientific_name}
                    </p>

                    {tree.is_premium && (
                      <div className="inline-flex items-center mt-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                        <Award className="h-4 w-4 mr-2" />
                        Premium Tree
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex space-x-3">
                      <Link href={`/trees/${tree.id}/edit`}>
                        <Button
                          variant="outline"
                          className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-500/80 backdrop-blur-sm hover:bg-red-600/90"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {loading ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-white/90 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span>Back to Dashboard</span>
              </Link>

              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                {tree.common_name}
              </h1>
              <p className="text-blue-100 italic text-xl md:text-2xl">
                {tree.scientific_name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          {tree.tree_images && tree.tree_images.length > 0 && (
            <div className="lg:col-span-1">
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center">
                    <Leaf className="h-5 w-5 mr-2" />
                    Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tree.tree_images.map((img, index) => (
                      <div
                        key={index}
                        className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100 shadow-md cursor-pointer hover:shadow-lg transition-shadow group"
                        onClick={() => openImageModal(index)}
                      >
                        <Image
                          src={img.image_url || "/placeholder.svg"}
                          alt={`${tree.common_name} ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-sm font-medium text-gray-800">
                              View Full Size
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Details Section */}
          <div
            className={`${
              tree.tree_images && tree.tree_images.length > 0
                ? "lg:col-span-2"
                : "lg:col-span-3"
            } space-y-6`}
          >
            {tree.description && (
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-blue-800">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                    {tree.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {tree.facts && tree.facts.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-blue-800">
                    Interesting Facts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderBoxedList(tree.facts as string)}
                </CardContent>
              </Card>
            )}

            {/* Premium Details */}
            {tree.is_premium && (
              <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-amber-800 flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Premium Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {tree.age && (
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800 mb-2">
                        Age
                      </h3>
                      <p className="text-slate-700 text-lg">
                        {tree.age} years old
                      </p>
                    </div>
                  )}

                  {tree.biological_conditions && (
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800 mb-2">
                        Biological Conditions
                      </h3>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {tree.biological_conditions}
                      </p>
                    </div>
                  )}

                  {tree.care_timeline && (
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800 mb-3">
                        Care Timeline
                      </h3>
                      {renderCareTimeline(tree.care_timeline)}
                    </div>
                  )}

                  {tree.benefits && tree.benefits.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800 mb-3">
                        Benefits
                      </h3>
                      {renderBoxedList(tree.benefits as string)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Full-width Map Section */}
        {tree.latitude && tree.longitude && (
          <Card className="mt-8 bg-white/80 backdrop-blur-sm border-blue-100 shadow-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-600">
                      Latitude:
                    </span>
                    <span className="text-blue-600 font-mono">
                      {tree.latitude}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-600">
                      Longitude:
                    </span>
                    <span className="text-blue-600 font-mono">
                      {tree.longitude}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full h-[400px] md:h-[500px] relative">
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

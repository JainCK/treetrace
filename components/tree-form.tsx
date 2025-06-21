// tree-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/utils/supabase/client";
import { TreeWithImages } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Your existing treeSchema for form validation
const treeSchema = z.object({
  common_name: z.string().min(1, "Common name is required"),
  scientific_name: z.string().min(1, "Scientific name is required"),
  facts: z.string().optional(),
  description: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type TreeFormData = z.infer<typeof treeSchema>;

interface TreeFormProps {
  initialData?: TreeWithImages;
  onSuccess: (treeId: string) => void;
}

export function TreeForm({ initialData, onSuccess }: TreeFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<FileList | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TreeFormData>({
    resolver: zodResolver(treeSchema),
    defaultValues: initialData
      ? {
          common_name: initialData.common_name,
          scientific_name: initialData.scientific_name,
          facts: initialData.facts || "",
          description: initialData.description || "",
          latitude: initialData.latitude || undefined,
          longitude: initialData.longitude || undefined,
        }
      : {
          common_name: "",
          scientific_name: "",
          facts: "",
          description: "",
          latitude: undefined,
          longitude: undefined,
        },
  });

  const uploadImages = async (
    files: FileList,
    treeId: string,
    userId: string
  ) => {
    if (!userId) {
      console.error("User ID is missing for image upload.");
      throw new Error("Authentication error during image upload.");
    }

    const uploadPromises = Array.from(files).map(async (file) => {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      // Path within the bucket: userId/treeId/fileName. The 'public/' prefix is NOT needed here.
      const filePath = `${userId}/${treeId}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("treeimages") // CORRECTED: Ensure this exactly matches your bucket name "treeimages"
        .upload(filePath, file);

      if (uploadError) {
        // Improved error logging
        console.error(
          "Error uploading image to storage:",
          JSON.stringify(uploadError, null, 2)
        );
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("treeimages").getPublicUrl(filePath); // CORRECTED: Ensure this exactly matches your bucket name "treeimages"

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const onSubmit = async (data: TreeFormData) => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated. Please log in again.");
      }

      let treeId = initialData?.id;

      if (initialData) {
        // Update existing tree
        const { error: updateError } = await supabase
          .from("trees")
          .update({
            common_name: data.common_name,
            scientific_name: data.scientific_name,
            facts: data.facts || null,
            description: data.description || null,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
          })
          .eq("id", initialData.id)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error updating tree:", updateError);
          throw updateError;
        }
      } else {
        // Create new tree
        const { data: newTree, error: insertError } = await supabase
          .from("trees")
          .insert({
            user_id: user.id,
            common_name: data.common_name,
            scientific_name: data.scientific_name,
            facts: data.facts || null,
            description: data.description || null,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating new tree:", insertError);
          throw insertError;
        }
        treeId = newTree.id;
      }

      // Handle image uploads
      if (images && images.length > 0 && treeId) {
        // If editing, first delete existing images (from storage and DB)
        if (initialData) {
          // This block runs ONLY when initialData (editing an existing tree) is present
          // Delete from storage
          const deleteStoragePromises = initialData.tree_images.map(
            async (img) => {
              const pathSegments = img.image_url.split("/");
              // Extract the path relative to the bucket: userId/treeId/fileName.jpg
              const path = pathSegments
                .slice(pathSegments.indexOf("public") + 2)
                .join("/");

              return supabase.storage.from("treeimages").remove([path]);
            }
          );
          await Promise.all(deleteStoragePromises);

          // Delete from database
          const { error: deleteDbError } = await supabase
            .from("tree_images")
            .delete()
            .eq("tree_id", treeId);

          if (deleteDbError) {
            console.error(
              "Error deleting old image records from database:",
              deleteDbError
            );
            throw deleteDbError;
          }
        }

        // Upload new images
        const imageUrls = await uploadImages(images, treeId, user.id);

        // Insert new image records into the database
        const imageRecords = imageUrls.map((url) => ({
          tree_id: treeId,
          image_url: url,
        }));

        const { error: imageInsertError } = await supabase
          .from("tree_images") // CORRECTED: Table name "tree_images"
          .insert(imageRecords);

        if (imageInsertError) {
          console.error("Error inserting new image records:", imageInsertError);
          throw imageInsertError;
        }
      }

      onSuccess(treeId!);
      reset();
    } catch (err: any) {
      console.error("Form submission error:", err); // Log full error for debugging
      setError(
        err.message || "An unexpected error occurred during submission."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Tree" : "Add New Tree"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="common_name">Common Name *</Label>
              <Input
                id="common_name"
                {...register("common_name")}
                disabled={loading}
              />
              {errors.common_name && (
                <p className="text-red-600 text-sm">
                  {errors.common_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scientific_name">Scientific Name *</Label>
              <Input
                id="scientific_name"
                {...register("scientific_name")}
                disabled={loading}
              />
              {errors.scientific_name && (
                <p className="text-red-600 text-sm">
                  {errors.scientific_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facts">Facts</Label>
            <textarea
              id="facts"
              {...register("facts")}
              disabled={loading}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              disabled={loading}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                {...register("latitude", { valueAsNumber: true })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                {...register("longitude", { valueAsNumber: true })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Images</Label>
            <Input
              id="images"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages(e.target.files)}
              disabled={loading}
            />
            <p className="text-sm text-gray-600">
              Select multiple images (3-4 recommended)
            </p>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : initialData ? "Update Tree" : "Add Tree"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

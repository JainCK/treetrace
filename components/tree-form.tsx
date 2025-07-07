// src/components/tree-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/utils/supabase/client";
import { TreeWithImages } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this component

// Your existing treeSchema for form validation
const treeSchema = z.object({
  common_name: z.string().min(1, "Common name is required"),
  scientific_name: z.string().min(1, "Scientific name is required"),
  facts: z.string().optional(),
  description: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  location: z.string().optional().nullable(),
  landmark: z.string().optional().nullable(),
  carbon_footprint: z
    .number()
    .positive("Carbon footprint must be positive")
    .optional()
    .nullable(),
  is_premium: z.boolean().optional(),
  age: z
    .number()
    .int()
    .positive("Age must be a positive integer")
    .optional()
    .nullable(),
  biological_conditions: z.string().optional().nullable(),
  care_timeline: z.string().optional().nullable(),
  benefits: z.string().optional().nullable(),
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
    watch,
    setValue,
  } = useForm<TreeFormData>({
    resolver: zodResolver(treeSchema),
    defaultValues: initialData
      ? {
          common_name: initialData.common_name,
          scientific_name: initialData.scientific_name,
          facts: initialData.facts || "",
          description: initialData.description || "",
          latitude: initialData.latitude ?? undefined,
          longitude: initialData.longitude ?? undefined,
          is_premium: initialData.is_premium ?? false,
          age: initialData.age ?? undefined,
          biological_conditions: initialData.biological_conditions ?? "",
          care_timeline: initialData.care_timeline
            ? JSON.stringify(initialData.care_timeline, null, 2)
            : "",
          benefits: initialData.benefits ?? "",
          location: initialData.location ?? "",
          landmark: initialData.landmark ?? "",
          carbon_footprint: initialData.carbon_footprint ?? undefined,
        }
      : {
          common_name: "",
          scientific_name: "",
          facts: "",
          description: "",
          latitude: undefined,
          longitude: undefined,
          is_premium: false,
          age: undefined,
          biological_conditions: "",
          care_timeline: "",
          benefits: "",
          location: "",
          landmark: "",
          carbon_footprint: undefined,
        },
  });

  const isPremium = watch("is_premium");

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
      const filePath = `${userId}/${treeId}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("treeimages")
        .upload(filePath, file);

      if (uploadError) {
        console.error(
          "Error uploading image to storage:",
          JSON.stringify(uploadError, null, 2)
        );
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("treeimages").getPublicUrl(filePath);

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

      let parsedCareTimeline = null;
      if (data.is_premium && data.care_timeline) {
        try {
          parsedCareTimeline = JSON.parse(data.care_timeline);
          // Optional: Add more specific validation for the JSON structure here if needed
          if (!Array.isArray(parsedCareTimeline)) {
            throw new Error("Care timeline must be a valid JSON array.");
          }
        } catch (jsonError: any) {
          throw new Error(
            `Invalid JSON format for Care Timeline: ${jsonError.message}`
          );
        }
      }

      const premiumFields = data.is_premium
        ? {
            is_premium: true,
            age: data.age || null,
            biological_conditions: data.biological_conditions || null,
            care_timeline: parsedCareTimeline, // Use the parsed JSON
            benefits: data.benefits || null,
          }
        : {
            is_premium: false,
            age: null,
            biological_conditions: null,
            care_timeline: null,
            benefits: null,
          };

      if (initialData) {
        const { error: updateError } = await supabase
          .from("trees")
          .update({
            common_name: data.common_name,
            scientific_name: data.scientific_name,
            facts: data.facts || null,
            description: data.description || null,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            location: data.location || null,
            landmark: data.landmark || null,
            carbon_footprint: data.carbon_footprint || null,
            ...premiumFields,
          })
          .eq("id", initialData.id);

        if (updateError) {
          console.error("Error updating tree:", updateError);
          throw updateError;
        }
      } else {
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
            location: data.location || null,
            landmark: data.landmark || null,
            carbon_footprint: data.carbon_footprint || null,
            ...premiumFields,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating new tree:", insertError);
          throw insertError;
        }
        treeId = newTree.id;
      }

      if (images && images.length > 0 && treeId) {
        if (initialData) {
          const deleteStoragePromises = initialData.tree_images.map(
            async (img) => {
              const pathSegments = img.image_url.split("/");
              const path = pathSegments
                .slice(pathSegments.indexOf("public") + 2)
                .join("/");

              return supabase.storage.from("treeimages").remove([path]);
            }
          );
          await Promise.all(deleteStoragePromises);

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

        const imageUrls = await uploadImages(images, treeId, user.id);

        const imageRecords = imageUrls.map((url) => ({
          tree_id: treeId,
          image_url: url,
        }));

        const { error: imageInsertError } = await supabase
          .from("tree_images")
          .insert(imageRecords);

        if (imageInsertError) {
          console.error("Error inserting new image records:", imageInsertError);
          throw imageInsertError;
        }
      }

      onSuccess(treeId!);
      reset();
    } catch (err: any) {
      console.error("Form submission error:", err);
      setError(
        err.message || "An unexpected error occurred during submission."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto md:max-w-5xl lg:max-w-7xl rounded-xl shadow-lg p-4 md:p-8 border border-blue-100 bg-white">
      {" "}
      {/* Increased max-width and enhanced styling */}
      <CardHeader className="text-center pb-6">
        {" "}
        {/* Centered header */}
        <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {initialData ? "Edit Tree Details" : "Add a New Tree"}
        </CardTitle>
        <p className="text-gray-600 text-lg">
          {initialData
            ? "Update information about your tree."
            : "Fill in the details to add a new tree to your collection."}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {" "}
          {/* Increased vertical spacing */}
          {/* General Details Section */}
          <div className="space-y-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <h3 className="text-xl font-semibold text-blue-700">
              General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="common_name">Common Name *</Label>
                <Input
                  id="common_name"
                  {...register("common_name")}
                  disabled={loading}
                  className="w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
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
              <Textarea
                id="facts"
                {...register("facts")}
                disabled={loading}
                className="min-h-[100px] w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                disabled={loading}
                className="min-h-[120px] w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          {/* Location Section */}
          <div className="space-y-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <h3 className="text-xl font-semibold text-blue-700">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  {...register("latitude", { valueAsNumber: true })}
                  disabled={loading}
                  className="w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">General Location (Optional)</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., Central Park, New York"
                  {...register("location")}
                  disabled={loading}
                  className="w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-600">
                  Enter a descriptive location for easier searching
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="landmark">Landmark (Optional)</Label>
                <Input
                  id="landmark"
                  type="text"
                  placeholder="e.g., Near the main fountain"
                  {...register("landmark")}
                  disabled={loading}
                  className="w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-600">
                  Nearby landmark or reference point
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="carbon_footprint">
                  Carbon Footprint (Optional)
                </Label>
                <Input
                  id="carbon_footprint"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 22.5"
                  {...register("carbon_footprint", { valueAsNumber: true })}
                  disabled={loading}
                  className="w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-600">
                  Annual CO₂ absorption in kg
                </p>
              </div>
            </div>
          </div>
          {/* Premium Tree Section Toggle */}
          <div className="flex items-center space-x-3 mt-6 p-4 rounded-lg border border-blue-200 bg-blue-50 shadow-sm">
            <Checkbox
              id="is_premium"
              {...register("is_premium")}
              checked={isPremium}
              onCheckedChange={(checked) => setValue("is_premium", !!checked)}
              disabled={loading}
              className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
            />
            <Label
              htmlFor="is_premium"
              className="text-lg font-medium text-blue-800 cursor-pointer"
            >
              Enable Premium Tree Details
            </Label>
          </div>
          {/* Conditional Premium Fields */}
          {isPremium && (
            <div className="space-y-4 p-4 rounded-lg border border-green-200 bg-green-50 shadow-inner">
              <h3 className="text-xl font-semibold text-green-700">
                Premium Details
              </h3>
              <div className="space-y-2">
                <Label htmlFor="age">Age (Years)</Label>
                <Input
                  id="age"
                  type="number"
                  step="1"
                  {...register("age", { valueAsNumber: true })}
                  disabled={loading}
                  className="w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-green-500 focus:border-green-500"
                />
                {errors.age && (
                  <p className="text-red-600 text-sm">{errors.age.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="biological_conditions">
                  Biological Conditions
                </Label>
                <Textarea
                  id="biological_conditions"
                  {...register("biological_conditions")}
                  disabled={loading}
                  className="min-h-[100px] w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="care_timeline">
                  Care Timeline (JSON Array)
                </Label>
                <Textarea
                  id="care_timeline"
                  {...register("care_timeline")}
                  disabled={loading}
                  placeholder='e.g., [{"date": "2023-01-15", "event": "Pruning"}, {"date": "2023-03-01", "event": "Fertilization"}]'
                  className="min-h-[120px] w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-green-500 focus:border-green-500"
                />
                {errors.care_timeline && (
                  <p className="text-red-600 text-sm">
                    {errors.care_timeline.message}
                  </p>
                )}
                {/* JSONB guidance banner */}
                <div
                  role="alert"
                  className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mt-2 rounded-md"
                >
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-blue-600 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-2 2a1 1 0 00-1 1v3a1 1 0 001 1h2a1 1 0 001-1V9a1 1 0 00-1-1h-2z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <p className="font-semibold">
                      Important for Care Timeline:
                    </p>
                  </div>
                  <p className="mt-1 text-sm">
                    This field expects a valid JSON array. Example:{" "}
                    <code className="bg-blue-200 px-1 rounded text-blue-900 text-xs">{`[{"date": "YYYY-MM-DD", "event": "Description"}]`}</code>
                    <br />
                    You can use an online JSON validator (like{" "}
                    <a
                      href="https://jsonformatter.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-900"
                    >
                      jsonformatter.org
                    </a>
                    ) to check your syntax.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefits">Benefits</Label>
                <Textarea
                  id="benefits"
                  {...register("benefits")}
                  disabled={loading}
                  className="min-h-[100px] w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          )}
          {/* Image Upload Section */}
          <div className="space-y-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <h3 className="text-xl font-semibold text-blue-700">Tree Images</h3>
            <div className="space-y-2">
              <Label htmlFor="images">Images</Label>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImages(e.target.files)}
                disabled={loading}
                className="w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-600">
                Select multiple images (3-4 recommended). Existing images will
                be replaced on edit if new ones are selected.
              </p>
            </div>
          </div>
          {error && (
            <div className="text-red-600 text-sm text-center mt-4 p-2 border border-red-300 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <div className="flex justify-center pt-4">
            {" "}
            {/* Centered buttons */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Saving..." : initialData ? "Update Tree" : "Add Tree"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

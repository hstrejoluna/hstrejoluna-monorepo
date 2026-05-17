import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

const projectId = "73v5iufs";
const dataset = "production";
const apiVersion = "2024-04-05";
const serverReadToken =
  typeof window === "undefined"
    ? process.env.SANITY_API_READ_TOKEN
    : undefined;

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  token: serverReadToken,
});

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token:
    typeof window === "undefined"
      ? process.env.SANITY_API_WRITE_TOKEN
      : undefined,
});

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

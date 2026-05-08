export interface ProfileSocialLink {
  platform: string;
  url?: string;
  email?: string;
  label?: string;
  order?: number;
}

export interface Profile {
  name?: string;
  headline?: string;
  bio?: string;
  image?: SanityImage;
  socials?: ProfileSocialLink[];
}

export interface SanityImage {
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
}

export interface PortableTextSpan {
  _type: "span";
  text: string;
  marks?: string[];
}

export interface PortableTextMarkDef {
  _key: string;
  _type: string;
}

export interface PortableTextBlock {
  _type: "block";
  children?: PortableTextSpan[];
  markDefs?: PortableTextMarkDef[];
  style?: string;
}

export interface Project {
  _id: string;
  title: string;
  slug?: { current: string };
  description: string | PortableTextBlock[];
  content?: PortableTextBlock[];
  year?: string;
  role?: string;
  gallery?: SanityImage[];
  image?: SanityImage;
  techStack?: Skill[];
  micrositePath?: string;
  externalLink?: string;
  isFeatured?: boolean;
  /** Plain-text SEO description, max 200 characters */
  shortDescription?: string;
  /** SEO keywords for meta tags */
  seoKeywords?: string[];
  /** Project category */
  category?: string;
}

export interface Experience {
  _id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description: string | PortableTextBlock[];
}

export interface Skill {
  _id: string;
  name: string;
  proficiency: number;
  category: string;
}

export interface Certificate {
  _id: string;
  name: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  source: "linkedin";
}

export interface SyncCertificatesResult {
  fetched: number;
  upserted: number;
  skipped: number;
  warnings: string[];
}

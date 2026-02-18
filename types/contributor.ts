export type LinkType = "personal" | "linkedin";

export interface ContributorProps {
  name: string;
  links: Partial<Record<LinkType, string>>;
}
"use client";

import { LayoutTemplate, Megaphone, ShoppingBasket, Star } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useSlots } from "./use-website";
import { SlotCard, type SlotCardConfig } from "./slot-card";
import { StoreDetailsCard } from "./store-details-card";

/** In the order they appear on the website, top to bottom. */
const CARDS: SlotCardConfig[] = [
  {
    type: "announcement",
    icon: Megaphone,
    name: "Announcement bar",
    does: "One line across the very top of every page. Good for delivery deals or opening hours.",
    titleLabel: "Message",
    titlePlaceholder: "Free delivery over GH₵120 this week",
    fields: [],
  },
  {
    type: "hero",
    icon: LayoutTemplate,
    name: "Hero banner",
    does: "The big banner at the top of the homepage: a headline, a button, one poster picture and up to two products shown with it.",
    titleLabel: "Headline",
    titlePlaceholder: "Fresh groceries, delivered",
    fields: ["subtitle", "image", "twoProducts", "button"],
  },
  {
    type: "product_of_week",
    icon: Star,
    name: "Product of the week",
    does: "One product shown as a large feature card just below the banner.",
    titleLabel: "Heading",
    titlePlaceholder: "This week's pick",
    defaultTitle: "This week's pick",
    fields: ["subtitle", "oneProduct"],
  },
  {
    type: "collection",
    icon: ShoppingBasket,
    name: "Hand-picked collection",
    does: "A titled row of products you choose, like “Weekend braai” or “Back to school”.",
    titleLabel: "Row title",
    titlePlaceholder: "Weekend essentials",
    fields: ["subtitle", "manyProducts"],
  },
];

export function HomepageTab() {
  const { data: slots = [], isPending } = useSlots();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Each card is one block of the website homepage, numbered in the order it appears there. Select a card to edit it. The
        switch puts it on or takes it off the website.
      </p>
      {isPending ? (
        <div className="columns-1 gap-4 lg:columns-2">
          {[120, 220, 160, 190].map((h, i) => (
            <Skeleton key={i} className="mb-4 w-full break-inside-avoid rounded-xl" style={{ height: h }} />
          ))}
        </div>
      ) : (
        // Staggered columns: each card keeps its own height, with no stretching to line rows up.
        <div className="columns-1 gap-4 lg:columns-2">
          {CARDS.map((c, i) => (
            <div key={c.type} className="mb-4 break-inside-avoid">
              <SlotCard config={c} slot={slots.find((s) => s.type === c.type) ?? null} position={i + 1} />
            </div>
          ))}
          <div className="mb-4 break-inside-avoid">
            <StoreDetailsCard />
          </div>
        </div>
      )}
    </div>
  );
}

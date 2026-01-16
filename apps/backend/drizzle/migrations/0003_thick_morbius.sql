ALTER TYPE "public"."discount_scope" ADD VALUE 'variant' BEFORE 'code';--> statement-breakpoint
CREATE TABLE "discount_variants" (
	"discount_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	CONSTRAINT "discount_variants_discount_id_variant_id_pk" PRIMARY KEY("discount_id","variant_id")
);
--> statement-breakpoint
ALTER TABLE "discount_variants" ADD CONSTRAINT "discount_variants_discount_id_discounts_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_variants" ADD CONSTRAINT "discount_variants_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
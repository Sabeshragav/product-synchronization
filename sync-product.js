import { createDirectus, authentication, rest } from "@directus/sdk";
import Medusa from "@medusajs/medusa-js";
import fetch from "node-fetch";

// Initialize Directus client
const directus = createDirectus("http://localhost:8055")
  .with(authentication())
  .with(rest());

// Initialize Medusa client
const medusa = new Medusa({ baseUrl: "http://localhost:9000", maxRetries: 3 });

// Function to authenticate with Directus
async function authenticateDirectus() {
  await directus.login({
    email: process.env.DIRECTUS_EMAIL,
    password: process.env.DIRECTUS_PASS,
  });
}

// Function to authenticate with Medusa
async function authenticateMedusa() {
  await medusa.admin.auth.createSession({
    email: process.env.MEDUSA_EMAIL,
    password: process.env.MEDUSA_PASS,
  });
}

// Function to upload an image to Medusa
async function uploadImageToMedusa(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    const file = new File([buffer], "product-image.jpg", {
      type: "image/jpeg",
    });

    const formData = new FormData();
    formData.append("files", file);

    const { uploads } = await medusa.admin.uploadFile(formData);
    return uploads[0].url;
  } catch (error) {
    console.error("Error uploading image to Medusa:", error);
    return null;
  }
}

// Function to create a product in Medusa
async function createProductInMedusa(product) {
  try {
    const imageUrls = await Promise.all(
      product.images.map(uploadImageToMedusa)
    );

    const { product: createdProduct } = await medusa.admin.products.create({
      title: product.name,
      description: product.description,
      variants: [
        {
          prices: [{ amount: product.price * 100, currency_code: "usd" }],
        },
      ],
      images: imageUrls.filter((url) => url !== null),
    });
    console.log("Product created in Medusa:", createdProduct.id);
    return createdProduct.id;
  } catch (error) {
    console.error("Error creating product in Medusa:", error);
  }
}

// Function to update a product in Medusa
async function updateProductInMedusa(productId, product) {
  try {
    const imageUrls = await Promise.all(
      product.images.map(uploadImageToMedusa)
    );

    const { product: updatedProduct } = await medusa.admin.products.update(
      productId,
      {
        title: product.name,
        description: product.description,
        // Note: Updating variants and prices requires more complex logic
        // You may need to fetch existing variants and update them individually
        images: imageUrls.filter((url) => url !== null),
      }
    );
    console.log("Product updated in Medusa:", updatedProduct.id);
  } catch (error) {
    console.error("Error updating product in Medusa:", error);
  }
}

// Function to delete a product in Medusa
async function deleteProductInMedusa(productId) {
  try {
    await medusa.admin.products.delete(productId);
    console.log("Product deleted in Medusa:", productId);
  } catch (error) {
    console.error("Error deleting product in Medusa:", error);
  }
}

// Main synchronization function
async function syncProducts() {
  await authenticateDirectus();
  await authenticateMedusa();

  // Get all products from Directus
  const directusProducts = await directus
    .items("products")
    .readByQuery({ limit: -1 });

  for (const product of directusProducts.data) {
    // Check if product exists in Medusa
    const { products } = await medusa.admin.products.list({ q: product.name });

    if (products.length === 0) {
      // Create new product in Medusa
      await createProductInMedusa(product);
    } else {
      // Update existing product in Medusa
      await updateProductInMedusa(products[0].id, product);
    }
  }

  // Handle deletions (products in Medusa that no longer exist in Directus)
  const { products: medusaProducts } = await medusa.admin.products.list();
  for (const medusaProduct of medusaProducts) {
    const directusProduct = directusProducts.data.find(
      (p) => p.name === medusaProduct.title
    );
    if (!directusProduct) {
      await deleteProductInMedusa(medusaProduct.id);
    }
  }
}

// Run the synchronization
syncProducts().catch(console.error.message);

console.log("Synchronization script started. Check the logs for details.");

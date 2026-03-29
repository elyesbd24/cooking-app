import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Initialize regular Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? "",
);

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-e298476a/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/make-server-e298476a/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json(
        { error: "Email, password, and name are required" },
        400,
      );
    }

    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, role: "user" },
        // Automatically confirm the user's email since an email server hasn't been configured.
        email_confirm: true,
      });

    if (error) {
      console.log(`Error signing up user: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Initialize user data in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name: name,
      role: "user",
      favorites: [],
    });

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log(`Error in signup endpoint: ${error}`);
    return c.json({ error: "Failed to sign up user" }, 500);
  }
});

// Get current user info
app.get("/make-server-e298476a/user", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) {
      console.log(`Error getting user: ${error?.message}`);
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    return c.json({
      user: userData || {
        id: user.id,
        email: user.email,
        role: "user",
      },
    });
  } catch (error) {
    console.log(`Error in user endpoint: ${error}`);
    return c.json({ error: "Failed to get user info" }, 500);
  }
});

// Submit a new recipe (requires authentication)
app.post("/make-server-e298476a/recipes", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) {
      console.log(
        `Authorization error while submitting recipe: ${error?.message}`,
      );
      return c.json({ error: "Unauthorized" }, 401);
    }

    const {
      title,
      description,
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      category,
      image,
    } = await c.req.json();

    if (
      !title ||
      !description ||
      !ingredients ||
      !instructions
    ) {
      return c.json(
        {
          error:
            "Title, description, ingredients, and instructions are required",
        },
        400,
      );
    }

    const recipeId = `recipe:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const recipe = {
      id: recipeId,
      title,
      description,
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      category,
      image,
      authorId: user.id,
      authorName: user.user_metadata?.name || user.email,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await kv.set(recipeId, recipe);

    return c.json({ success: true, recipe });
  } catch (error) {
    console.log(`Error submitting recipe: ${error}`);
    return c.json({ error: "Failed to submit recipe" }, 500);
  }
});

// Get all approved recipes
app.get("/make-server-e298476a/recipes", async (c) => {
  try {
    const recipes = await kv.getByPrefix("recipe:");
    const approvedRecipes = recipes.filter(
      (r: any) => r.status === "approved",
    );
    return c.json({ recipes: approvedRecipes });
  } catch (error) {
    console.log(`Error fetching recipes: ${error}`);
    return c.json({ error: "Failed to fetch recipes" }, 500);
  }
});

// Get all pending recipes (admin only)
app.get("/make-server-e298476a/recipes/pending", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }

    const recipes = await kv.getByPrefix("recipe:");
    const pendingRecipes = recipes.filter(
      (r: any) => r.status === "pending",
    );
    return c.json({ recipes: pendingRecipes });
  } catch (error) {
    console.log(`Error fetching pending recipes: ${error}`);
    return c.json(
      { error: "Failed to fetch pending recipes" },
      500,
    );
  }
});

// Approve a recipe (admin only)
app.post(
  "/make-server-e298476a/recipes/:id/approve",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      if (!accessToken) {
        return c.json(
          { error: "No access token provided" },
          401,
        );
      }

      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);
      if (error || !user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const userData = await kv.get(`user:${user.id}`);
      if (!userData || userData.role !== "admin") {
        return c.json({ error: "Admin access required" }, 403);
      }

      const recipeId = c.req.param("id");
      const recipe = await kv.get(recipeId);

      if (!recipe) {
        return c.json({ error: "Recipe not found" }, 404);
      }

      recipe.status = "approved";
      await kv.set(recipeId, recipe);

      return c.json({ success: true, recipe });
    } catch (error) {
      console.log(`Error approving recipe: ${error}`);
      return c.json({ error: "Failed to approve recipe" }, 500);
    }
  },
);

// Delete a recipe (admin only)
app.delete("/make-server-e298476a/recipes/:id", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }

    const recipeId = c.req.param("id");
    await kv.del(recipeId);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting recipe: ${error}`);
    return c.json({ error: "Failed to delete recipe" }, 500);
  }
});

// Add recipe to favorites
app.post(
  "/make-server-e298476a/favorites/:recipeId",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      if (!accessToken) {
        return c.json(
          { error: "No access token provided" },
          401,
        );
      }

      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);
      if (error || !user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const recipeId = c.req.param("recipeId");
      const userData = await kv.get(`user:${user.id}`);

      if (!userData.favorites) {
        userData.favorites = [];
      }

      if (!userData.favorites.includes(recipeId)) {
        userData.favorites.push(recipeId);
        await kv.set(`user:${user.id}`, userData);
      }

      return c.json({
        success: true,
        favorites: userData.favorites,
      });
    } catch (error) {
      console.log(`Error adding to favorites: ${error}`);
      return c.json(
        { error: "Failed to add to favorites" },
        500,
      );
    }
  },
);

// Remove recipe from favorites
app.delete(
  "/make-server-e298476a/favorites/:recipeId",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      if (!accessToken) {
        return c.json(
          { error: "No access token provided" },
          401,
        );
      }

      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(accessToken);
      if (error || !user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const recipeId = c.req.param("recipeId");
      const userData = await kv.get(`user:${user.id}`);

      if (userData.favorites) {
        userData.favorites = userData.favorites.filter(
          (id: string) => id !== recipeId,
        );
        await kv.set(`user:${user.id}`, userData);
      }

      return c.json({
        success: true,
        favorites: userData.favorites,
      });
    } catch (error) {
      console.log(`Error removing from favorites: ${error}`);
      return c.json(
        { error: "Failed to remove from favorites" },
        500,
      );
    }
  },
);

// Get user's favorite recipes
app.get("/make-server-e298476a/favorites", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const favoriteIds = userData?.favorites || [];

    const favoriteRecipes = await kv.mget(favoriteIds);

    return c.json({
      recipes: favoriteRecipes.filter((r) => r !== null),
    });
  } catch (error) {
    console.log(`Error fetching favorites: ${error}`);
    return c.json({ error: "Failed to fetch favorites" }, 500);
  }
});

// Search recipes by ingredients
app.post("/make-server-e298476a/recipes/search", async (c) => {
  try {
    const { ingredients } = await c.req.json();

    if (
      !ingredients ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return c.json(
        { error: "Ingredients array is required" },
        400,
      );
    }

    const recipes = await kv.getByPrefix("recipe:");
    const approvedRecipes = recipes.filter(
      (r: any) => r.status === "approved",
    );

    // Search for recipes that contain all the provided ingredients
    const matchingRecipes = approvedRecipes.filter(
      (recipe: any) => {
        const recipeIngredients = recipe.ingredients.map(
          (ing: string) => ing.toLowerCase(),
        );
        return ingredients.every((userIng: string) =>
          recipeIngredients.some((recipeIng: string) =>
            recipeIng.includes(userIng.toLowerCase()),
          ),
        );
      },
    );

    return c.json({ recipes: matchingRecipes });
  } catch (error) {
    console.log(`Error searching recipes: ${error}`);
    return c.json({ error: "Failed to search recipes" }, 500);
  }
});

Deno.serve(app.fetch);
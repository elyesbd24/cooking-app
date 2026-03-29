import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { RecipeDetail } from "./components/RecipeDetail";
import { SubmitRecipe } from "./components/SubmitRecipe";
import { Favorites } from "./components/Favorites";
import { AdminDashboard } from "./components/AdminDashboard";
import { IngredientSearch } from "./components/IngredientSearch";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
      { path: "recipe/:id", Component: RecipeDetail },
      { path: "submit", Component: SubmitRecipe },
      { path: "favorites", Component: Favorites },
      { path: "admin", Component: AdminDashboard },
      { path: "search", Component: IngredientSearch },
      { path: "*", Component: NotFound },
    ],
  },
]);

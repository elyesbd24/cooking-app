import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Search, PlusCircle, X, Clock, Users, Heart } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  category?: string;
  image?: string;
  authorName: string;
  status: string;
  createdAt: string;
}

export function IngredientSearch() {
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { user, accessToken, refreshUser } = useAuth();

  const addIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  const searchRecipes = async () => {
    if (ingredients.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e298476a/recipes/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ ingredients }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
        
        if (data.recipes.length === 0) {
          toast.info('No recipes found with those ingredients');
        } else {
          toast.success(`Found ${data.recipes.length} recipe(s)`);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to search recipes');
      }
    } catch (error) {
      console.error('Error searching recipes:', error);
      toast.error('Failed to search recipes');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (recipeId: string) => {
    if (!user || !accessToken) {
      toast.error('Please log in to add favorites');
      return;
    }

    const isFavorite = user.favorites?.includes(recipeId);
    const method = isFavorite ? 'DELETE' : 'POST';

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e298476a/favorites/${recipeId}`,
        {
          method,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        await refreshUser();
        toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Find Recipes by Ingredients</h1>
          <p className="text-gray-600">
            Enter the ingredients you have at home, and we'll find recipes you can make!
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Ingredients</CardTitle>
            <CardDescription>
              Add ingredients one by one. We'll find recipes that use all of them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="ingredient">Add Ingredient</Label>
                <Input
                  id="ingredient"
                  placeholder="e.g., chicken, tomatoes, rice"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <Button 
                className="mt-8" 
                onClick={addIngredient}
                disabled={!ingredientInput.trim()}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-md">
                {ingredients.map((ingredient) => (
                  <Badge key={ingredient} variant="secondary" className="text-sm py-1.5 px-3">
                    {ingredient}
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <Button 
              className="w-full" 
              size="lg"
              onClick={searchRecipes}
              disabled={ingredients.length === 0 || loading}
            >
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Searching...' : 'Find Recipes'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              {recipes.length > 0 
                ? `Found ${recipes.length} Recipe${recipes.length > 1 ? 's' : ''}`
                : 'No Recipes Found'
              }
            </h2>

            {recipes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-4">
                    No recipes found with those ingredients. Try using fewer ingredients or different ones.
                  </p>
                  <Link to="/">
                    <Button variant="outline">Browse All Recipes</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recipes.map((recipe) => (
                  <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {recipe.image && (
                      <img 
                        src={recipe.image} 
                        alt={recipe.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{recipe.title}</CardTitle>
                          <CardDescription>By {recipe.authorName}</CardDescription>
                        </div>
                        {user && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(recipe.id)}
                            className="ml-2"
                          >
                            <Heart
                              className={`w-5 h-5 ${
                                user.favorites?.includes(recipe.id)
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-gray-400'
                              }`}
                            />
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {recipe.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {recipe.category && (
                          <Badge variant="secondary">{recipe.category}</Badge>
                        )}
                        {recipe.prepTime && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{recipe.prepTime}</span>
                          </div>
                        )}
                        {recipe.servings && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{recipe.servings} servings</span>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Link to={`/recipe/${recipe.id}`} className="w-full">
                        <Button className="w-full">View Recipe</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

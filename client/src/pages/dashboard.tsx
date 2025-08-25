import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import LocationSelector from "@/components/LocationSelector";
import WeatherCard from "@/components/WeatherCard";
import CropCard from "@/components/CropCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  User as LucideUser, 
  Leaf, 
  Cloud, 
  TrendingUp, 
  Bell, 
  Calendar, 
  UserCheck, 
  LogOut,
  Lightbulb,
  Microscope,
  CheckCircle,
  Droplets,
  Eye,
  Sun
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  selectedState?: string;
  selectedSoilType?: string;
  createdAt: string;
  updatedAt: string;
}

interface CropRecommendation {
  id: string;
  userId: string;
  cropId: string;
  stateId: string;
  soilTypeId: string;
  compatibilityScore: number;
  recommendations: string;
  createdAt: string;
  crop: {
    id: string;
    name: string;
    season: string;
    description: string;
    expectedYield: string;
    growthDuration: number;
    waterRequirement: string;
  };
  state: {
    id: string;
    name: string;
    code: string;
  };
  soilType: {
    id: string;
    name: string;
    description: string;
    phRange: string;
    characteristics: string;
  };
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // Type the user properly
  const typedUser = user as User | undefined;

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch crop recommendations
  const { data: cropRecommendations = [], isLoading: isLoadingRecommendations } = useQuery<CropRecommendation[]>({
    queryKey: ["/api/crop-recommendations"],
    retry: false,
    enabled: isAuthenticated,
    select: (data: any) => {
      // Transform the data structure if needed
      console.log("Raw crop recommendations data:", data);
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    }
  });

  // Generate new crop recommendations mutation
  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/crop-recommendations/generate");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crop-recommendations"] });
      toast({
        title: "Success",
        description: "New crop recommendations generated!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate crop recommendations",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleGenerateRecommendations = () => {
    if (!typedUser?.selectedState || !typedUser?.selectedSoilType) {
      toast({
        title: "Missing Information",
        description: "Please select your state and soil type first",
        variant: "destructive",
      });
      return;
    }
    generateRecommendationsMutation.mutate();
  };

  const handleRequestDetailedAnalysis = () => {
    toast({
      title: "Detailed Analysis Requested",
      description: "Our agricultural experts will contact you within 24 hours with a comprehensive soil analysis report.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Leaf className="h-12 w-12 text-farm-green mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Leaf className="text-farm-green text-2xl" />
                <h1 className="text-2xl font-bold text-gray-900">CropAdviser</h1>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex space-x-6">
                <span className="text-farm-green font-medium">Dashboard</span>
                <span className="text-gray-600">Crop Cards</span>
                <span className="text-gray-600">Weather</span>
                <span className="text-gray-600">Profile</span>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-farm-green rounded-full flex items-center justify-center">
                  <LucideUser className="text-white text-sm" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {typedUser?.firstName || typedUser?.email || 'Farmer'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-farm-green to-farm-green-light rounded-xl p-6 text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-2xl font-bold mb-2">
                  Welcome back, {typedUser?.firstName || 'Farmer'}!
                </h2>
                <p className="text-green-100">Here's your farming insights for today</p>
                {(((user as any)?.selectedStateName) || typedUser?.selectedState) && (
                  <div className="flex items-center mt-3 text-green-100">
                    <span data-testid="text-user-location">
                      Location: {((user as any)?.selectedStateName) || typedUser?.selectedState}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Location & Weather Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <LocationSelector />
          <WeatherCard />
        </div>

        {/* Crop Cards Dashboard */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Crop Cards</h2>
            <Button 
              onClick={handleGenerateRecommendations}
              disabled={generateRecommendationsMutation.isPending}
              className="bg-farm-green text-white hover:bg-green-700"
              data-testid="button-generate-crops"
            >
              <Leaf className="h-4 w-4 mr-2" />
              {generateRecommendationsMutation.isPending ? "Generating..." : "Generate New Card"}
            </Button>
          </div>

          {isLoadingRecommendations ? (
            <div className="grid lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="bg-gray-300 h-20 rounded-t-xl"></div>
                  <CardContent className="p-6">
                    <div className="bg-gray-300 h-32 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="bg-gray-300 h-4 rounded"></div>
                      <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (cropRecommendations && cropRecommendations.length > 0) ? (
            <div className="grid lg:grid-cols-2 gap-6">
              {cropRecommendations.slice(0, 4).map((recommendation: CropRecommendation) => (
                <CropCard 
                  key={recommendation.id} 
                  recommendation={recommendation}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center p-12">
              <CardContent>
                <Leaf className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Crop Cards Yet</h3>
                <p className="text-gray-600 mb-4">
                  Select your state and soil type, then generate personalized crop recommendations
                </p>
                <Button 
                  onClick={handleGenerateRecommendations}
                  disabled={!typedUser?.selectedState || !typedUser?.selectedSoilType}
                  className="bg-farm-green text-white hover:bg-green-700"
                  data-testid="button-generate-first-crops"
                >
                  <Leaf className="h-4 w-4 mr-2" />
                  Generate Your First Crop Card
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommendations Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Farming Tips Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Lightbulb className="text-farm-amber mr-3 h-5 w-5" />
                <h3 className="text-lg font-semibold text-gray-900">Smart Farming Tips</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="text-farm-green mt-1 h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Irrigation Timing</p>
                    <p className="text-sm text-gray-600">Early morning irrigation reduces water loss by evaporation</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Droplets className="text-blue-500 mt-1 h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Soil Moisture</p>
                    <p className="text-sm text-gray-600">Check soil moisture 6 inches deep before watering</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
                  <Leaf className="text-farm-amber mt-1 h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Nutrient Management</p>
                    <p className="text-sm text-gray-600">Split nitrogen application for better crop uptake</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Soil Analysis Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Microscope className="text-farm-brown mr-3 h-5 w-5" />
                <h3 className="text-lg font-semibold text-gray-900">Soil Analysis</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">pH Level</span>
                  <span className="text-sm font-medium text-farm-green">6.8 (Optimal)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Organic Matter</span>
                  <span className="text-sm font-medium text-farm-green">3.2% (Good)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nitrogen</span>
                  <span className="text-sm font-medium text-farm-amber">Medium</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Phosphorus</span>
                  <span className="text-sm font-medium text-farm-green">High</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Potassium</span>
                  <span className="text-sm font-medium text-farm-green">High</span>
                </div>
              </div>
              
              <Button 
                onClick={handleRequestDetailedAnalysis}
                className="w-full mt-4 bg-farm-brown text-white hover:bg-amber-700"
                data-testid="button-request-analysis"
              >
                Request Detailed Analysis
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-4 h-auto bg-green-50 hover:bg-green-100 border-green-200"
                data-testid="button-market-prices"
              >
                <TrendingUp className="text-farm-green text-2xl mb-2 h-8 w-8" />
                <span className="text-sm font-medium text-gray-900">Market Prices</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-4 h-auto bg-blue-50 hover:bg-blue-100 border-blue-200"
                data-testid="button-weather-alerts"
              >
                <Bell className="text-blue-500 text-2xl mb-2 h-8 w-8" />
                <span className="text-sm font-medium text-gray-900">Weather Alerts</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-4 h-auto bg-amber-50 hover:bg-amber-100 border-amber-200"
                data-testid="button-crop-calendar"
              >
                <Calendar className="text-farm-amber text-2xl mb-2 h-8 w-8" />
                <span className="text-sm font-medium text-gray-900">Crop Calendar</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-4 h-auto bg-purple-50 hover:bg-purple-100 border-purple-200"
                data-testid="button-expert-consult"
              >
                <UserCheck className="text-purple-500 text-2xl mb-2 h-8 w-8" />
                <span className="text-sm font-medium text-gray-900">Expert Consult</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

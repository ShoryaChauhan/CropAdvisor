import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Cloud, TrendingUp, Users, MapPin, Droplets } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Leaf className="text-farm-green text-2xl" />
              <h1 className="text-2xl font-bold text-gray-900">CropAdviser</h1>
            </div>
            <Button 
              onClick={handleLogin}
              className="bg-farm-green hover:bg-green-700"
              data-testid="button-login"
            >
              Login / Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Smart Farming for
              <span className="text-farm-green block">Better Harvests</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Get personalized crop recommendations, weather insights, and farming guidance 
              tailored to your location and soil type. Make informed decisions for better yields.
            </p>
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-farm-green hover:bg-green-700 text-lg px-8 py-3"
              data-testid="button-get-started"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Smart Farming
            </h2>
            <p className="text-lg text-gray-600">
              Comprehensive tools to help you make the right farming decisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <MapPin className="h-8 w-8 text-farm-green mr-3" />
                  <h3 className="text-xl font-semibold">Location-Based Insights</h3>
                </div>
                <p className="text-gray-600">
                  Select your state and soil type to receive recommendations 
                  specifically tailored to your region's conditions.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Leaf className="h-8 w-8 text-farm-green mr-3" />
                  <h3 className="text-xl font-semibold">Crop Recommendations</h3>
                </div>
                <p className="text-gray-600">
                  Get personalized crop cards with yield predictions, growth stages, 
                  and farming best practices for your specific conditions.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Cloud className="h-8 w-8 text-farm-amber mr-3" />
                  <h3 className="text-xl font-semibold">Weather Insights</h3>
                </div>
                <p className="text-gray-600">
                  Real-time weather data and 5-day forecasts to help you plan 
                  irrigation, harvesting, and other farming activities.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="h-8 w-8 text-farm-green mr-3" />
                  <h3 className="text-xl font-semibold">Soil Analysis</h3>
                </div>
                <p className="text-gray-600">
                  Comprehensive soil compatibility analysis with pH levels, 
                  nutrient content, and improvement recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Droplets className="h-8 w-8 text-blue-500 mr-3" />
                  <h3 className="text-xl font-semibold">Smart Irrigation</h3>
                </div>
                <p className="text-gray-600">
                  Intelligent irrigation timing suggestions based on crop needs, 
                  soil moisture, and weather conditions.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Users className="h-8 w-8 text-farm-green mr-3" />
                  <h3 className="text-xl font-semibold">Expert Guidance</h3>
                </div>
                <p className="text-gray-600">
                  Access to farming tips, pest control advice, and best practices 
                  from agricultural experts across India.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-farm-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Farming?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of farmers already using CropAdviser to improve their yields
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            variant="secondary"
            className="bg-white text-farm-green hover:bg-gray-100 text-lg px-8 py-3"
            data-testid="button-join-now"
          >
            Join Now - It's Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2">
            <Leaf className="text-farm-green text-2xl" />
            <span className="text-xl font-bold">CropAdviser</span>
          </div>
          <p className="text-center text-gray-400 mt-4">
            Empowering farmers with smart agricultural insights
          </p>
        </div>
      </footer>
    </div>
  );
}

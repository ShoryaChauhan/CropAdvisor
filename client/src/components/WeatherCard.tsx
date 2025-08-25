import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Cloud, Droplets, Wind, Eye, Sun, CloudRain, Info } from "lucide-react";

interface WeatherData {
  id: string;
  stateId: string;
  temperature: string;
  humidity: number;
  windSpeed: string;
  visibility: string;
  conditions: string;
  forecast: string;
  lastUpdated: string;
}

interface ForecastDay {
  day: string;
  temp: string;
  condition: string;
  icon: string;
}

export default function WeatherCard() {
  const { user } = useAuth();

  // Fetch weather data for user's selected state
  const { data: weather, isLoading: isLoadingWeather } = useQuery({
    queryKey: ["/api/weather", user?.selectedState],
    enabled: !!user?.selectedState,
    retry: false,
  });

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return <Sun className="text-yellow-500 h-6 w-6" />;
      case 'partly cloudy':
        return <Cloud className="text-gray-500 h-6 w-6" />;
      case 'cloudy':
        return <Cloud className="text-gray-400 h-6 w-6" />;
      case 'light rain':
        return <CloudRain className="text-blue-500 h-6 w-6" />;
      default:
        return <Sun className="text-yellow-500 h-6 w-6" />;
    }
  };

  const getForecastIcon = (iconName: string) => {
    switch (iconName) {
      case 'sun':
        return <Sun className="text-yellow-500 h-6 w-6" />;
      case 'cloud-sun':
        return <Cloud className="text-gray-500 h-6 w-6" />;
      case 'cloud':
        return <Cloud className="text-gray-400 h-6 w-6" />;
      case 'cloud-rain':
        return <CloudRain className="text-blue-500 h-6 w-6" />;
      default:
        return <Sun className="text-yellow-500 h-6 w-6" />;
    }
  };

  if (!user?.selectedState) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Cloud className="text-farm-amber mr-3 h-5 w-5" />
              <h3 className="text-lg font-semibold text-gray-900">Weather Insights</h3>
            </div>
          </div>
          <div className="text-center py-8">
            <Cloud className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Select your state to view weather data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingWeather) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Cloud className="text-farm-amber mr-3 h-5 w-5" />
              <h3 className="text-lg font-semibold text-gray-900">Weather Insights</h3>
            </div>
          </div>
          <div className="animate-pulse">
            <div className="bg-gray-300 h-32 rounded-lg mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-300 h-4 rounded"></div>
              <div className="bg-gray-300 h-4 rounded"></div>
              <div className="bg-gray-300 h-4 rounded"></div>
              <div className="bg-gray-300 h-4 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const weatherData: WeatherData = weather;
  const forecast: ForecastDay[] = weatherData?.forecast ? JSON.parse(weatherData.forecast) : [];

  return (
    <div className="space-y-6">
      {/* Current Weather Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Cloud className="text-farm-amber mr-3 h-5 w-5" />
              <h3 className="text-lg font-semibold text-gray-900">Today's Weather</h3>
            </div>
            <span className="text-2xl font-bold text-farm-green" data-testid="text-temperature">
              {weatherData?.temperature}°C
            </span>
          </div>
          
          <div className="mb-4 flex items-center justify-center py-4">
            {weatherData && getWeatherIcon(weatherData.conditions)}
            <span className="ml-2 text-lg font-medium" data-testid="text-weather-condition">
              {weatherData?.conditions}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <Droplets className="text-blue-500 mr-2 h-4 w-4" />
              <span className="text-gray-600">Humidity:</span>
              <span className="ml-1 font-medium" data-testid="text-humidity">
                {weatherData?.humidity}%
              </span>
            </div>
            <div className="flex items-center">
              <Wind className="text-gray-500 mr-2 h-4 w-4" />
              <span className="text-gray-600">Wind:</span>
              <span className="ml-1 font-medium" data-testid="text-wind-speed">
                {weatherData?.windSpeed} km/h
              </span>
            </div>
            <div className="flex items-center">
              <Eye className="text-indigo-500 mr-2 h-4 w-4" />
              <span className="text-gray-600">Visibility:</span>
              <span className="ml-1 font-medium">
                {weatherData?.visibility} km
              </span>
            </div>
            <div className="flex items-center">
              <Sun className="text-red-500 mr-2 h-4 w-4" />
              <span className="text-gray-600">Feels like:</span>
              <span className="ml-1 font-medium">
                {weatherData ? Math.round(parseFloat(weatherData.temperature) + 3) : 0}°C
              </span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <Info className="inline mr-2 h-4 w-4" />
              Perfect conditions for irrigation today!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 5-Day Forecast */}
      {forecast.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">5-Day Weather Forecast</h3>
            
            <div className="grid grid-cols-5 gap-2">
              {forecast.map((day: ForecastDay, index: number) => (
                <div 
                  key={index}
                  className="text-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  data-testid={`forecast-day-${index}`}
                >
                  <p className="text-sm font-medium text-gray-900 mb-1">{day.day}</p>
                  <div className="flex justify-center mb-2">
                    {getForecastIcon(day.icon)}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{day.condition}</p>
                  <p className="text-sm font-bold text-gray-900">{day.temp}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

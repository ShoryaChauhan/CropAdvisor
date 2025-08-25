import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, Leaf, Bug, CheckCircle } from "lucide-react";

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

interface CropCardProps {
  recommendation: CropRecommendation;
}

export default function CropCard({ recommendation }: CropCardProps) {
  const { crop, compatibilityScore } = recommendation;
  
  // Parse recommendations JSON
  let recommendations: { irrigation?: string; fertilizer?: string; pestControl?: string } = {};
  try {
    recommendations = JSON.parse(recommendation.recommendations || "{}");
  } catch (error) {
    console.error("Error parsing recommendations:", error);
  }

  // Get background color based on crop type
  const getCardGradient = (cropName: string) => {
    switch (cropName.toLowerCase()) {
      case 'rice':
        return 'from-farm-green to-green-600';
      case 'wheat':
        return 'from-farm-amber to-orange-500';
      case 'cotton':
        return 'from-blue-500 to-blue-600';
      case 'sugarcane':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-farm-green to-green-600';
    }
  };

  // Get compatibility status and color
  const getCompatibilityStatus = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 80) return { label: 'Very Good', color: 'text-green-500' };
    if (score >= 70) return { label: 'Good', color: 'text-yellow-600' };
    if (score >= 60) return { label: 'Fair', color: 'text-orange-500' };
    return { label: 'Poor', color: 'text-red-500' };
  };

  // Get growth stage (mock based on season and current time)
  const getCurrentGrowthStage = (season: string) => {
    const stages = {
      Kharif: ['Sowing', 'Vegetative', 'Flowering', 'Maturity'],
      Rabi: ['Germination', 'Tillering', 'Flowering', 'Grain Filling'],
      Perennial: ['Growing', 'Mature', 'Harvest Ready', 'Processing']
    };
    
    const stageList = stages[season as keyof typeof stages] || stages.Kharif;
    return stageList[Math.floor(Math.random() * stageList.length)];
  };

  const currentStage = getCurrentGrowthStage(crop.season);
  const compatibility = getCompatibilityStatus(compatibilityScore);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`crop-card-${crop.id}`}>
      <div className={`bg-gradient-to-r ${getCardGradient(crop.name)} p-4`}>
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-xl font-bold" data-testid={`crop-name-${crop.id}`}>
              {crop.name} Cultivation
            </h3>
            <p className="text-green-100">{crop.season} Season 2024</p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="bg-white/20 text-white mb-2">
              {crop.season}
            </Badge>
            <p className="text-sm">{crop.growthDuration} days</p>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Expected Yield</p>
            <p className="text-lg font-bold text-farm-green" data-testid={`yield-${crop.id}`}>
              {crop.expectedYield}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Growth Stage</p>
            <p className="text-lg font-bold text-farm-amber" data-testid={`stage-${crop.id}`}>
              {currentStage}
            </p>
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          {recommendations.irrigation && (
            <div className="flex items-start space-x-3">
              <Droplets className="text-blue-500 mt-0.5 h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{recommendations.irrigation}</span>
            </div>
          )}
          
          {recommendations.fertilizer && (
            <div className="flex items-start space-x-3">
              <Leaf className="text-green-500 mt-0.5 h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{recommendations.fertilizer}</span>
            </div>
          )}
          
          {recommendations.pestControl && (
            <div className="flex items-start space-x-3">
              <Bug className="text-red-500 mt-0.5 h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{recommendations.pestControl}</span>
            </div>
          )}
          
          <div className="flex items-start space-x-3">
            <CheckCircle className="text-green-500 mt-0.5 h-4 w-4 flex-shrink-0" />
            <span className="text-sm">Water requirement: {crop.waterRequirement}</span>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Soil Compatibility</span>
            <span className={`font-medium ${compatibility.color}`} data-testid={`compatibility-${crop.id}`}>
              {compatibility.label} ({compatibilityScore}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

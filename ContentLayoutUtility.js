angular.module('rubedo').controller("ContentLayoutController", ['$scope','$sce',function($scope,$sce){
	var me = this
    me.convertCityData2HTML = function(){
        me.cityOverviewHTML = $sce.trustAsHtml($scope.content.fields.Overview);
        me.cityGettingAroundHTML = $sce.trustAsHtml($scope.content.fields.GettingAround);
        me.citySightseeingHTML = $sce.trustAsHtml($scope.content.fields.Sightseeing);
        me.cityKidsAttractionHTML = $sce.trustAsHtml($scope.content.fields.KidsAttraction);
        me.cityNightLifeHTML = $sce.trustAsHtml($scope.content.fields.NightLife);
        me.cityShoppingHTML = $sce.trustAsHtml($scope.content.fields.Shopping);
        me.cityRestaurantHTML = $sce.trustAsHtml($scope.content.fields.Restaurant);
        me.cityClimateHTML = $sce.trustAsHtml($scope.content.fields.Climate);
        me.cityGoogleMapHTML = $sce.trustAsResourceUrl('https://maps.google.com.tw/maps?f=d&ll='+$scope.content.fields.position.lat+','+$scope.content.fields.position.lon+'&hl=en&z=14&output=embed&t=m');
        me.mapLocationURL = $sce.trustAsResourceUrl("https://www.google.com/maps/embed/v1/place?key=AIzaSyB-ngVWkM5Sl6S1cLPxks9wz10Mp9s-vmY&q="+($scope.content.fields.position.location.coordinates[1])+','+($scope.content.fields.position.location.coordinates[0]));

        me.cityRestaurantHTML = $sce.trustAsHtml($scope.content.fields.Restaurant);
        me.cityGetInHTML = $sce.trustAsHtml($scope.content.fields.getIn);
        me.cityGoNextHTML = $sce.trustAsHtml($scope.content.fields.goNext);
        me.cityDoHTML = $sce.trustAsHtml($scope.content.fields.do);
        me.citySleepHTML = $sce.trustAsHtml($scope.content.fields.sleep);
        me.cityStaySafeHTML = $sce.trustAsHtml($scope.content.fields.staySafe);
        me.cityStayHealthyHTML = $sce.trustAsHtml($scope.content.fields.stayHealthy);
        me.cityTalkHTML = $sce.trustAsHtml($scope.content.fields.talk);

    };
    me.convertCountryData2HTML=function(){

    };
    me.convertAttractionData2HTML=function(){
        me.attractionDescriptionHTML = $sce.trustAsHtml($scope.content.fields.Description);
        me.mapLocationURL = $sce.trustAsResourceUrl("https://www.google.com/maps/embed/v1/place?key=AIzaSyB-ngVWkM5Sl6S1cLPxks9wz10Mp9s-vmY&q="+($scope.content.fields.position.location.coordinates[1])+','+($scope.content.fields.position.location.coordinates[0]));
    };
}]);
"use strict";

/*
 A controller to manage the Group Plans page
 */

angular.module('habitrpg')
  .controller("GroupPlansCtrl", ['$scope', '$window', 'Groups', 'Payments',
    function($scope, $window, Groups, Payments) {
      $scope.PAGES = {
        BENEFITS: 'benefits',
        CREATE_GROUP: 'create-group',
        UPGRADE_GROUP: 'upgrade-group',
      };
      $scope.activePage = $scope.PAGES.BENEFITS;
      $scope.newGroup = {
        type: 'guild',
        privacy: 'private',
      };
      $scope.PAYMENTS = {
        AMAZON: 'amazon',
        STRIPE: 'stripe',
      };

      $scope.changePage = function (page) {
        $scope.activePage = page;
        $window.scrollTo(0, 0);
      };

      $scope.newGroupIsReady = function () {
        return $scope.newGroup.name && $scope.newGroup.description;
      };

      $scope.createGroup = function () {
        $scope.changePage($scope.PAGES.UPGRADE_GROUP);
      };

      $scope.upgradeGroup = function (paymentType) {
        if (!confirm(window.env.t('confirmGuild'))) return;

        Groups.Group.create($scope.newGroup)
          .then(function (response) {
            var group = response.data.data;
            var subscriptionKey = 'group_monthly'; // @TODO: Get from content API?
            if (paymentType === $scope.PAYMENTS.STRIPE) Payments.showStripe({subscription: subscriptionKey, coupon: null, groupId: group.id});
            if (paymentType === $scope.PAYMENTS.AMAZON) Payments.amazonPayments.init({type: 'subscription', subscription: subscriptionKey, coupon: null, groupId: group.id});
            // $rootScope.hardRedirect('/#/options/groups/guilds/' + createdGroup._id + '?upgrade=true');
          });
      };
    }]);

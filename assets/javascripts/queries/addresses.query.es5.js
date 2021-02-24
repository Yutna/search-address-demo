function AddressesQuery(addresses) {
  this.addresses = addresses;
  this.fuse = new Fuse([], {
    ignoreLocation: true,
    includeMatches: true,
    includeScore: true,
    minMatchCharLength: 2
  });
}

AddressesQuery.call = function(addresses, searchPharse) {
  var addressesQuery = new AddressesQuery(addresses);
  return addressesQuery.search(searchPharse);
};

AddressesQuery.prototype.search = function(searchPhrase) {
  if (searchPhrase === "") {
    return [];
  }

  var patterns = this.getPatterns(searchPhrase);
  var results = [];

  var subdistrictResults = this.searchFromSubdistricts(this.addresses, patterns);
  var districtResults = this.searchFromDistricts(this.addresses, patterns);
  var provinceResults = this.searchFromProvinces(this.addresses, patterns);
  var zipCodeResults = this.searchFromZipCodes(this.addresses, patterns);

  var searchResult = {
    subdistrict: subdistrictResults,
    district: districtResults,
    province: provinceResults,
    zipCode: zipCodeResults
  };

  var subdistrictScore = _.minBy(subdistrictResults, "score");
  var districtScore = _.minBy(districtResults, "score");
  var provinceScore = _.minBy(provinceResults, "score");
  var zipCodeScore = _.minBy(zipCodeResults, "score");

  var allScores = [subdistrictScore, districtScore, provinceScore, zipCodeScore];
  var sortedByScore = _.chain(allScores).compact().sortBy(["score"]).value();
  var sortedTypes = _.map(sortedByScore, function(item) { return item.searchType; });
  var type = _.first(sortedTypes);

  if (!type) {
    return [];
  }

  var matchAddresses = [];
  var addresses = this.addresses;

  _.each(searchResult[type], function(resultItem) {
    _.each(addresses, function(address) {
      var item = resultItem.item;

      if (address[type] === item) {
        matchAddresses.push(address);
      }
    });
  });

  results = this.searchFromFullAddress(matchAddresses, patterns);

  return results;
};

AddressesQuery.prototype.getPatterns = function(searchPhrase) {
  var regexp = /(\s+|ซ\.|ถ\.|ต\.|อ\.|จ\.|ซอย|ถนน|แขวง|เขต|ตำบล|อำเภอ|จังหวัด)/;
  var removeFn = function(element) {
    return !element.match(regexp) && (element !== "");
  };

  var patterns = _.chain(searchPhrase)
                  .split(regexp)
                  .remove(removeFn)
                  .takeRight(4)
                  .value();

  return [].concat(patterns, Array(4 - patterns.length).fill("N/A"));
};

AddressesQuery.prototype.getSubdistricts = function(addresses) {
  var mapFn = function(address) {
    return address.subdistrict;
  };

  return _.chain(addresses)
          .map(mapFn)
          .uniq()
          .value();
};

AddressesQuery.prototype.getDistricts = function(addresses) {
  var mapFn = function(address) {
    return address.district;
  };

  return _.chain(addresses)
          .map(mapFn)
          .uniq()
          .value();
};

AddressesQuery.prototype.getProvinces = function(addresses) {
  var mapFn = function(address) {
    return address.district;
  };

  return _.chain(addresses)
          .map(mapFn)
          .uniq()
          .value();
};

AddressesQuery.prototype.getZipCodes = function(addresses) {
  var mapFn = function(address) {
    return address.zipCode;
  };

  return _.chain(addresses)
          .map(mapFn)
          .uniq()
          .value();
};

AddressesQuery.prototype.getFullAddresses = function(addresses) {
  var mapFn = function(address) {
    var subdistrict = address.subdistrict;
    var district = address.district;
    var province = address.province;
    var zipCode = address.zipCode;

    return [subdistrict, district, province, zipCode].join(" ");
  };

  return _.chain(addresses)
          .map(mapFn)
          .uniq()
          .value();
};

AddressesQuery.prototype.searchFromSubdistricts = function(addresses, patterns) {
  var fuse = this.fuse;
  var subdistricts = this.getSubdistricts(addresses);
  var results = [];

  fuse.setCollection(subdistricts);

  _.each(patterns, function(pattern) {
    var matchResults = fuse.search(pattern);
    results = [].concat(results, matchResults);
  });

  var mapFn = function(item) {
    return item.searchType = "subdistrict";
  };

  return _.chain(results)
          .uniqBy("refIndex")
          .sortBy(["score"])
          .each(mapFn)
          .value();
};

AddressesQuery.prototype.searchFromDistricts = function(addresses, patterns) {
  var fuse = this.fuse;
  var districts = this.getDistricts(addresses);
  var results = [];

  fuse.setCollection(districts);

  _.each(patterns, function(pattern) {
    var matchResults = fuse.search(pattern);
    results = [].concat(results, matchResults);
  });

  var mapFn = function(item) {
    return item.searchType = "district";
  };

  return _.chain(results)
          .uniqBy("refIndex")
          .sortBy(["score"])
          .each(mapFn)
          .value();
};

AddressesQuery.prototype.searchFromProvinces = function(addresses, patterns) {
  var fuse = this.fuse;
  var provinces = this.getProvinces(addresses);
  var results = [];

  fuse.setCollection(provinces);

  _.each(patterns, function(pattern) {
    var matchResults = fuse.search(pattern);
    results = [].concat(results, matchResults);
  });

  var mapFn = function(item) {
    return item.searchType = "province";
  };

  return _.chain(results)
          .uniqBy("refIndex")
          .sortBy(["score"])
          .each(mapFn)
          .value();
};

AddressesQuery.prototype.searchFromZipCodes = function(addresses, patterns) {
  var fuse = this.fuse;
  var zipCodes = this.getZipCodes(addresses);
  var results = [];

  fuse.setCollection(zipCodes);

  _.each(patterns, function(pattern) {
    var matchResults = fuse.search(pattern);
    results = [].concat(results, matchResults);
  });

  var mapFn = function(item) {
    return item.searchType = "zipCode";
  };

  return _.chain(results)
          .uniqBy("refIndex")
          .sortBy(["score"])
          .each(mapFn)
          .value();
};

AddressesQuery.prototype.searchFromFullAddress = function(addresses, patterns) {
  var searchPharse = patterns.join(" ").replace(/(N\/A)/ig, "");
  var fullAddresses = this.getFullAddresses(addresses);
  var results = [];

  this.fuse.setCollection(fullAddresses);

  var mapFn = function(result) {
    return result.item;
  };

  results = this.fuse.search(searchPharse);
  results = results.length ? _.chain(results).map(mapFn).value() : fullAddresses;

  return results;
};

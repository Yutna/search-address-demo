class AddressesQuery {
  constructor(addresses) {
    this.addresses = addresses;
    this.fuse = new Fuse([], {
      ignoreLocation: true,
      includeMatches: true,
      includeScore: true,
      minMatchCharLength: 2
    });
  }

  static call(addresses, searchPharse) {
    const addressesQuery = new AddressesQuery(addresses);
    return addressesQuery.search(searchPharse);
  }

  search(searchPhrase) {
    if (searchPhrase === '') {
      return [];
    }

    const patterns = this.getPatterns(searchPhrase);
    let results = [];

    const subdistrictResults = this.searchFromSubdistricts(this.addresses, patterns);
    const districtResults = this.searchFromDistricts(this.addresses, patterns);
    const provinceResults = this.searchFromProvinces(this.addresses, patterns);
    const zipCodeResults = this.searchFromZipCodes(this.addresses, patterns);

    const searchResult = {
      subdistrict: subdistrictResults,
      district: districtResults,
      province: provinceResults,
      zipCode: zipCodeResults
    };

    const subdistrictScore = _.minBy(subdistrictResults, 'score');
    const districtScore = _.minBy(districtResults, 'score');
    const provinceScore = _.minBy(provinceResults, 'score');
    const zipCodeScore = _.minBy(zipCodeResults, 'score');

    const allScores = [subdistrictScore, districtScore, provinceScore, zipCodeScore];
    const sortedByScore = _.chain(allScores).compact().sortBy(['score']).value();
    const sortedTypes = _.map(sortedByScore, (item) => item.searchType);
    const type = _.first(sortedTypes);

    if (!type) {
      return [];
    }

    const matchAddresses = [];

    _.each(searchResult[type], (resultItem) => {
      _.each(this.addresses, (address) => {
        const { item } = resultItem;

        if (address[type] === item) {
          matchAddresses.push(address);
        }
      });
    });

    results = this.searchFromFullAddress(matchAddresses, patterns);

    return results;
  }

  getPatterns(searchPhrase) {
    const regexp = /(\s+|ซ\.|ถ\.|ต\.|อ\.|จ\.|ซอย|ถนน|แขวง|เขต|ตำบล|อำเภอ|จังหวัด)/;
    const removeFn = (element) => !element.match(regexp) && (element !== '');
    const patterns = _.chain(searchPhrase)
                      .split(regexp)
                      .remove(removeFn)
                      .takeRight(4)
                      .value();

    return [...patterns, ...Array(4 - patterns.length).fill('N/A')];
  }

  getSubdistricts(addresses) {
    const mapFn = (address) => address.subdistrict;

    return _.chain(addresses)
            .map(mapFn)
            .uniq()
            .value();
  }

  getDistricts(addresses) {
    const mapFn = (address) => address.district;

    return _.chain(addresses)
            .map(mapFn)
            .uniq()
            .value();
  }

  getProvinces(addresses) {
    const mapFn = (address) => address.province;

    return _.chain(addresses)
            .map(mapFn)
            .uniq()
            .value();
  }

  getZipCodes(addresses) {
    const mapFn = (address) => address.zipCode;

    return _.chain(addresses)
            .map(mapFn)
            .uniq()
            .value();
  }

  getFullAddresses(addresses) {
    const mapFn = ({ subdistrict, district, province, zipCode }) => `${subdistrict} ${district} ${province} ${zipCode}`;

    return _.chain(addresses)
            .map(mapFn)
            .uniq()
            .value();
  }

  searchFromSubdistricts(addresses, patterns) {
    const subdistricts = this.getSubdistricts(addresses);
    let results = [];

    this.fuse.setCollection(subdistricts);

    _.each(patterns, (pattern) => {
      const matchResults = this.fuse.search(pattern);
      results = [...results, ...matchResults];
    });

    return _.chain(results)
            .uniqBy('refIndex')
            .sortBy(['score'])
            .each((item) => item.searchType = 'subdistrict')
            .value();
  }

  searchFromDistricts(addresses, patterns) {
    const districts = this.getDistricts(addresses);
    let results = [];

    this.fuse.setCollection(districts);

    _.each(patterns, (pattern) => {
      const matchResults = this.fuse.search(pattern);
      results = [...results, ...matchResults];
    });

    return _.chain(results)
            .uniqBy('refIndex')
            .sortBy(['score'])
            .each((item) => item.searchType = 'district')
            .value();
  }

  searchFromProvinces(addresses, patterns) {
    const provinces = this.getProvinces(addresses);
    let results = [];

    this.fuse.setCollection(provinces);

    _.each(patterns, (pattern) => {
      const matchResults = this.fuse.search(pattern);
      results = [...results, ...matchResults];
    });

    return _.chain(results)
            .uniqBy('refIndex')
            .sortBy(['score'])
            .each((item) => item.searchType = 'province')
            .value();
  }

  searchFromZipCodes(addresses, patterns) {
    const zipCodes = this.getZipCodes(addresses);
    let results = [];

    this.fuse.setCollection(zipCodes);

    _.each(patterns, (pattern) => {
      const matchResults = this.fuse.search(pattern);
      results = [...results, ...matchResults];
    });

    return _.chain(results)
            .uniqBy('refIndex')
            .sortBy(['score'])
            .each((item) => item.searchType = 'zipCode')
            .value();
  }

  searchFromFullAddress(addresses, patterns) {
    const searchPharse = patterns.join(' ').replace(/(N\/A)/ig, '');
    const fullAddresses = this.getFullAddresses(addresses);
    let results = [];

    this.fuse.setCollection(fullAddresses);

    results = this.fuse.search(searchPharse);
    results = results.length ? _.chain(results).map(({ item }) => item).value() : fullAddresses;

    return results;
  }
}

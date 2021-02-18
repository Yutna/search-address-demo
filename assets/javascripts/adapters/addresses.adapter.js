class AddressesAdapter {
  static async get() {
    try {
      const baseUrl = window.location.href;
      const response = await fetch(`${baseUrl}/api/addresses.json`);
      const addresses = await response.json();

      return addresses;
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  }
}

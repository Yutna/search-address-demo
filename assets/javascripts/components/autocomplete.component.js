class Autocomplete {
  constructor(elementReference) {
    this.elementReference = elementReference;
    this.textareaElement  = this.elementReference.querySelector('textarea');
    this.ulElement        = this.elementReference.querySelector('ul');
    this.addresses        = [];
    this.timeoutToken     = null;

    this.handleInput      = this.handleInput.bind(this);

    this.setup();
    this.addEventListeners();
  }

  // Event handlers

  handleInput(event) {
    const { value } = event.target;

    if (!value) {
      this.clearAddressesQueryResults();
      return;
    }

    clearTimeout(this.timeoutToken);
    this.timeoutToken = setTimeout(() => {
      const results = AddressesQuery.call(this.addresses, value);

      this.clearAddressesQueryResults();
      this.renderAddressesQueryResults(results);
    }, 600);
  }

  // Component methods

  setup() {
    this.fetchAddresses();
  }

  addEventListeners() {
    this.textareaElement.addEventListener('input', this.handleInput);
  }

  clearAddressesQueryResults() {
    while (this.ulElement.firstChild) {
      this.ulElement.firstChild.remove();
    }
  }

  renderAddressesQueryResults(results) {
    results.forEach((address) => {
      const liElement = document.createElement('li');

      liElement.textContent = address;
      this.ulElement.appendChild(liElement);
    });
  }

  // Async functions

  async fetchAddresses() {
    const addresses = await AddressesAdapter.get();

    this.addresses = addresses;
    this.textareaElement.disabled = false;
  }
}

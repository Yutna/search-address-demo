class Autocomplete {
  constructor(elementReference) {
    this.elementReference = elementReference;
    this.textareaElement  = this.elementReference.querySelector('textarea');
    this.ulElement        = this.elementReference.querySelector('ul');
    this.highlighter      = new Mark(this.ulElement);
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
      this.renderSearchPhraseHighlighter(value);
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

  renderSearchPhraseHighlighter(searchPhrase) {
    const searchTerms = this.getSearchTerms(searchPhrase);
    this.highlighter.mark(searchTerms);
  }

  getSearchTerms(searchPhrase) {
    const regexp   = /(\s+|ซ\.|ถ\.|ต\.|อ\.|จ\.|ซอย|ถนน|แขวง|เขต|ตำบล|อำเภอ|จังหวัด)/;
    const removeFn = (element) => !element.match(regexp) && (element !== '');
    const patterns = _.chain(searchPhrase)
                      .split(regexp)
                      .remove(removeFn)
                      .takeRight(4)
                      .value();

    return _.compact([...patterns, ...Array(4 - patterns.length).fill('')]);
  }

  // Async functions

  async fetchAddresses() {
    const addresses = await AddressesAdapter.get();

    this.addresses = addresses;
    this.textareaElement.disabled = false;
  }
}

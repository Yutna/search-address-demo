class Autocomplete {
  constructor(elementReference) {
    this.elementReference = elementReference;
    this.textareaElement  = this.elementReference.querySelector('textarea.autocomplete__control');
    this.ulElement        = this.elementReference.querySelector('ul.autocomplete__list');
    this.highlighter      = new Mark(this.ulElement);
    this.addresses        = [];
    this.timeoutToken     = null;

    this.handleClick      = this.handleClick.bind(this);
    this.handleInput      = this.handleInput.bind(this);

    this.setup();
    this.addEventListeners();
  }

  // Event handlers

  handleClick(event) {
    const abbreviations = ['ต.', 'อ.', 'จ.', ''];
    const address = _.chain(event.target.textContent)
                     .split(' ')
                     .map((addr, index) => `${abbreviations[index]}${addr}`)
                     .join(' ')
                     .value();

    const inputValue = this.textareaElement.value;
    const newInputValue = _.chain(inputValue)
                           .split(' ')
                           .dropRight()
                           .concat(address)
                           .join(' ')
                           .value();

    this.textareaElement.value = newInputValue;
    this.clearAddressesQueryResults();
  }

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
      this.createAddressesQueryResults(results);
      this.createSearchPhraseHighlighter(value);
      this.renderSearchResults();
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
    this.ulElement.classList.remove('autocomplete__list--active');

    while (this.ulElement.firstChild) {
      const liElement = this.ulElement.firstChild;

      liElement.removeEventListener('click', this.handleClick);
      liElement.remove();
    }
  }

  createAddressesQueryResults(results) {
    results.forEach((address) => {
      const liElement = document.createElement('li');

      liElement.className = 'autocomplete__item'
      liElement.textContent = address;
      liElement.addEventListener('click', this.handleClick);

      this.ulElement.appendChild(liElement);
    });
  }

  createSearchPhraseHighlighter(searchPhrase) {
    const searchTerms = this.getSearchTerms(searchPhrase);
    this.highlighter.mark(searchTerms);
  }

  renderSearchResults() {
    this.ulElement.classList.add('autocomplete__list--active');
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

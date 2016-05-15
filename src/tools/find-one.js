module.exports = function( selector ) {
  var removeTmpId = createTmpId( this ),
    found = this.$.querySelector( getContextualizedSelector( this, selector ) );

  removeTmpId();

  return found ? new CKEDITOR.dom.element( found ) : null;
}


function getContextualizedSelector( element, selector ) {
		return '#' + element.$.id + ' ' + selector.split( /,\s*/ ).join( ', #' + element.$.id + ' ' );
	}

function createTmpId( element ) {
		var hadId = true;

		if ( !element.$.id ) {
			element.$.id = 'cke_tmp_' + CKEDITOR.tools.getNextNumber();
			hadId = false;
		}

		return function() {
			if ( !hadId )
				element.removeAttribute( 'id' );
		};
	}
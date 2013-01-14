var HTMLDecode = require('./htmlencoding').HTMLDecode;

function HtmlToDom(parser) {


  if (parser && parser.moduleName == 'HTML5') { /* HTML5 parser */
    this.appendHtmlToElement = function(html, element) {

      if (typeof html !== 'string') {
        html += '';
      }
      if (html.length > 0) {
        if (element.nodeType == 9) {
          new parser.Parser({document: element}).parse(html);
        }
        else {
          var p = new parser.Parser({document: element.ownerDocument});
          p.parse_fragment(html, element);
        }
      }
    };
  } else {

    this.appendHtmlToElement = function(){
      console.log('');
      console.log('###########################################################');
      console.log('#  WARNING: No HTML parser could be found.');
      console.log('#  Element.innerHTML setter support has been disabled');
      console.log('#  Element.innerHTML getter support will still function');
      console.log('#  Download: http://github.com/tautologistics/node-htmlparser');
      console.log('###########################################################');
      console.log('');
    };

  }
};

// utility function for forgiving parser
function setChild(parent, node) {

  var c, newNode, currentDocument = parent._ownerDocument || parent;

  switch (node.type)
  {
    case 'tag':
    case 'script':
    case 'style':
      try {
        newNode = currentDocument.createElement(node.name);
        if (node.location) {
          newNode.sourceLocation = node.location;
          newNode.sourceLocation.file = parent.sourceLocation.file;
        }
      } catch (err) {
        currentDocument.raise('error', 'invalid markup', {
          exception: err,
          node : node
        });

        return null;
      }
    break;

    case 'text':
      // Decode HTML entities if we're not inside a <script> or <style> tag:
      newNode = currentDocument.createTextNode(/^(?:script|style)$/i.test(parent.nodeName) ?
                                                   node.data :
                                                   HTMLDecode(node.data));
    break;

    case 'comment':
      newNode = currentDocument.createComment(node.data);
    break;

    default:
      return null;
    break;
  }

  if (!newNode)
    return null;

  if (node.attribs) {
    for (c in node.attribs) {
      // catchin errors here helps with improperly escaped attributes
      // but properly fixing parent should (can only?) be done in the htmlparser itself
      try {
        newNode.setAttribute(c.toLowerCase(), HTMLDecode(node.attribs[c]));
      } catch(e2) { /* noop */ }
    }
  }

  if (node.children) {
    for (c = 0; c < node.children.length; c++) {
      setChild(newNode, node.children[c]);
    }
  }

  try{
    return parent.appendChild(newNode);
  }catch(err){
    currentDocument.raise('error', err.message, {
          exception: err,
          node : node
        });
    return null;
  }
}

exports.HtmlToDom = HtmlToDom;

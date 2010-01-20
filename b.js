/*
             DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                     Version 2, December 2004

   Copyright (C) 2004 Sam Hocevar
   14 rue de Plaisance, 75014 Paris, France
   Everyone is permitted to copy and distribute verbatim or modified
   copies of this license document, and changing it is allowed as long
   as the name is changed.

   DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

   0. You just DO WHAT THE FUCK YOU WANT TO.
   
   Author: Mikhail Shakhanov - mshakhan@gmail.com
*/

(function() {
  if (!this.$) {
    function initCore() {      
      return {
        version: { major: 0, minor: 0, revision: 1 },
        wnd: window,        
        doc: document,
        
        f: function() {},        

        mixin: function(obj, mixin) {
          if (!mixin) {
            mixin = obj;
            obj = bjs.wnd;
          }
          for (p in mixin) {
            if (obj[p] != mixin[p]) {
              obj[p] = mixin[p];
            }
          }
          return obj;          
        },
        
        alias: function(obj, oldName, newName) {
          obj[newName] = obj[oldName];
          return obj;
        },
        
        each: function(array, iterator) {
          if (array) {
            for (var i = 0, l = array.length; i < l; ++i) {
              iterator(array[i], i);
            }
            return array;            
          } else return [];
        },
        
        map: function(array, iterator) {
          var newArray = [];
          this.each(array, function(e, i) {
            newArray.push(iterator(e, i));
          });
          return newArray;
        },
                
        timeout: function(proc, interval) {
          bjs.wnd.setTimeout(proc, interval);
          return proc;
        },
        
        rescue: function(proc, handler) {
          try {
            proc();
          } catch (ex) {
            if (handler) { handler(ex); }
          }
          return proc;
        },
        
        tryAll: function() {
          for (var i = 0, l = arguments.length; i < l; ++i) {
            this.rescue(arguments[i]);
          }
        },
                
        toArray: function(obj) {
          var array = [];
          if (obj.length) {
            bjs.each(obj, function(el) {
              array.push(el);
            })
          }
          
          return array;
        },
        
        toParams: function(obj) {
          if (obj) {
            var params = [];
            for (p in obj) {
              params.push(p + '=' + encodeURIComponent(obj[p]));
            }
            return params.join('&');            
          } else return '';
        },
        
        urlFor: function(location, params) {
          return encodeURIComponent(location) + '?' + this.toParams(params);
        },
        
        storage: initStorage(),

        dom:    initDom(),
        
        ajax:   initAjax()
      };
    }
    
    function initStorage() {
      var storage = {};
            
      return {
        get: function(key) {
          return storage[key];
        },
        
        put: function(key, value) {
          storage[key] = value;
          return value;
        }
      };
    }
    
    function initDom() {      
      return {
        elementMixin : {
          extended: function() {
            return true;
          }
        
          update: function(text) {
            return bjs.dom.update(this, text);
          },
          
          show: function() {
            return bjs.dom.show(this);
          },
          
          hide: function() {
            return bjs.dom.hide(this);
          },
          
          visible: function() {
            return bjs.dom.visible(this);
          },
          
          toggle: function() {
            return bjs.dom.toggle(this);
          },
          
          observe: function(name, handler) {
            return bjs.dom.observe(this, name, handler);
          }
        },
       
        extend: function(element) {
          if (element.extended && element.extended()) {
            return element;
          } else {
            return bjs.mixin(element, this.elementMixin);            
          }
        },
                
        ge: function(element) {
          element = (function(e) {
            if (typeof(e) == 'object') {
              return e;
            } else return bjs.doc.getElementById(e);            
          })(element);
          return this.extend(element);
        },
        
        qs: function(query) {
          bjs.map(querySelectAll(query), function(el) {
            return this.extend(el);
          });
        },
                
        update: function(element, text) {
          element = this.ge(element);
          element.innerHTML = text;
          return element;
        },
        
        show: function(element) {
          element = this.ge(element);
          element.style.display = 'block';
          return element;
        },
        
        hide: function(element) {
          element = this.ge(element);
          element.style.display = 'none';
          return element;
        },
        
        visible: function(element) {
          element = this.ge(element);
          return element.style.display != 'none';
        },
        
        toggle: function(element) {
          if (this.visible(element)) {
            this.hide(element);
          } else {
            this.show(element);
          }
        },
        
        observe: function(element, name, handler) {
          element = this.ge(element);
          if (element.addEventListener) {
            element.addEventListener(name, handler, false);
          } else {
            element.attachEvent("on" + name, handler);
          }
        },
        
        onload: function(handler) {
          var oldHandler = bjs.wnd['onload'] || bjs.f;
          bjs.wnd['onload'] = function() {
            oldHandler.apply(bjs.wnd, arguments);
            handler.apply(bjs.wnd, arguments);
          };           
        }        
      };
    }
    
    function initAjax() {
      function XHRget() {
        var xhr = null;
        try { 
          xhr = new XMLHttpRequest(); 
        } catch (e) {
          try {
            xhr = new ActiveXObject('Msxml2.XMLHTTP'); 
          } catch (e) {
            try {
              xhr = new ActiveXObject('Microsoft.XMLHTTP');              
            } catch (e) {}
          }   
        }
        
        if (!xhr) { throw new Error('Browser does not support XMLHTTP'); }
                
        return xhr;
      }
      
      function XHRCompleted(xhr) {
        return (4 == xhr.readyState);
      }
      
      return {
        request: function(url, method, options) {
          var xhr = XHRget();
          var oncomplete = options.oncomplete || bjs.f;
          
          url += bjs.toParams(options.params); 
          xhr.onreadystatechange = function() {
            if (XHRCompleted(xhr)) {
              try { oncomplete(xhr); } catch (e) {};
            }
          };
          
          if (options.body) { xhr.setRequestHeader(
            "Content-Type",
            "application/x-www-form-urlencoded"); 
          }
          xhr.open(method, url, !options.sync);
          xhr.send(options.body);
          return xhr;
        },
        
        get: function(url, options) {
          return this.request(url, 'GET', options);
        },
        
        post: function(url, options) {
          return this.request(url, 'POST', options);
        }
      };
    }    
    
    var bjs = initCore(); 
    this.$ = bjs;    
  }
})();

/*
TODO 
 1. location.href
 2. location.hash - observe changing
 3. improve ajax - eval scripts
 4. switchers (safe vars)
 5. modules
 6. complex keys in storage: $.storage.get('super.complex.key')
 7. dom.extend
 8. ???????
 9. PROFIT!
*/

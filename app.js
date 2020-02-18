var notesController = (function() {
    
    var Note = function(id, text, color, posX, posY, width, height) {
        this.id = id;
        this.text = text;
        this.color = color;
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
    };
    
    var notes = [];
    
    var createNewId = function() {
        var ID;
        
        if (notes.length > 0) {
            ID = notes[notes.length - 1].id + 1;
        } else {
            ID = 0;
        }
        
        return ID;
    };
       
    // call this if there's nothing in localstorage, i.e. the user hasn't used the app before
    var addWelcomeNote = function() {
            var newNote, ID;
            
            // create an id
            ID = createNewId();
            
            newNote = new Note(ID, 'Welcome!!!\nThis is an example note', 'yellow', 50, 50, 300, 350);
            notes.push(newNote);
        
            return newNote;
    };
    
    
    return {
        // on app init - read the notes from the localstorage
        loadNotes: function() {
            var storage = JSON.parse(localStorage.getItem('sticky_notes'));
            if (storage) {
                notes = storage;
            } else {
                addWelcomeNote();
                this.persistNotes();
            }
        },
        
        persistNotes: function() {
            localStorage.setItem('sticky_notes', JSON.stringify(notes));
        },
        
        //call without arguments to use default vaules
        addNote: function(text, color, posX, posY, width, height){
            var newNote, ID;
            var defaultWidth = 300, defaultHeight = 350;
            
            // create an id
            ID = createNewId();    
            
            // create the note
            if (arguments.length === 0) {
                //use the default values
                newNote = new Note(
                    ID,
                    '',
                    'yellow',
                    Math.ceil(window.innerWidth / 2 - defaultWidth / 2),
                    Math.ceil(window.innerHeight / 2 - defaultHeight / 2),
                    defaultHeight,
                    defaultWidth
                );
            } else {
                newNote = new Note(ID, text, color, posX, posY, height, width);
            }
            
            // add to the notes array
            notes.push(newNote);
            
            this.persistNotes();
            
            return newNote;
        },
        
        getNote: function(id) {
            id = parseInt(id);

            var ids, index;
            
            ids = notes.map(function(current) {
                return current.id;
            });

            index = ids.indexOf(id);

            return notes[index];
        },
        
        getAllNotes: function() {
            return notes;
        },
           
        
        deleteNote: function(id){
            id = parseInt(id);
            var ids, index;
            
            ids = notes.map(function(current) {
                return current.id;
            });

            index = ids.indexOf(id);
            
            notes.splice(index, 1);
            
            this.persistNotes();
        }
    };
    
})();


var UIController = (function() {
    
    var DOMstrings = {
        addNoteBtn: '.add-note-btn',
        sortNotesBtn: '.sort-notes-btn',
        notesContainer: '.notes',
        note: '.note',
        noteText: '.note-text',
        noteResizer: '.resizer',
        noteControls: '.note-controls',
        noteEditor: 'note-editor',
        noteEditorText: 'note-editor-text',
        noteControlsEditBtn: '.note-controls-edit',
        noteControlsColor: '.note-controls-color',
        noteControlsDelete: '.note-controls-delete',
        noteEditConfirm: '.note-edit-confirm',
        noteEditCancel: '.note-edit-cancel'
    };
    
    var colors = ['red', 'green', 'blue', 'yellow'];
    var minHeight = 250, minWidth = 300;
      
    return {
        // called on mousedown
        dragOrResize: function(e) {
            // mouse position when the event was triggered
            var prevX = e.clientX;
            var prevY = e.clientY;
            
            var note = e.target.closest(DOMstrings.note);
            
            // on mousemove
            var dragElement = function(e) {
                var newX = prevX - e.clientX;
                var newY = prevY - e.clientY;
            
                prevX = e.clientX;
                prevY = e.clientY;
                
                if ((note.offsetTop - newY) >= 0 && (note.offsetLeft - newX) >= 0) {
                    note.style.top = (note.offsetTop - newY) + 'px';
                    note.style.left = (note.offsetLeft - newX) + 'px';
                }
                
            }
            
            // on mousemove
            var resizeElement = function(e) {
                var newX = prevX - e.clientX;
                var newY = prevY - e.clientY;
            
                e.preventDefault();
                
                prevX = e.clientX;
                prevY = e.clientY;
                
                if ((note.offsetHeight - newY) >= minHeight && (note.offsetWidth - newX) >= minWidth)
                {
                    note.style.height = (note.offsetHeight - newY) + 'px';
                    note.style.width = (note.offsetWidth - newX) + 'px';
                }
                
            }
            
            var stopDragOrResize = function() {
                var event = new CustomEvent('note_changed', {bubbles: true});
                
                document.removeEventListener('mousemove', dragElement);
                document.removeEventListener('mousemove', resizeElement);
                document.removeEventListener('mouseup', stopDragOrResize);
                
                note.dispatchEvent(event);
            }
            
            if (note && !note.classList.contains('editing')) {
                
                if (e.target.matches('.resizer, .resizer *')) {
                    document.addEventListener('mousemove', resizeElement); 
                    document.addEventListener('mouseup', stopDragOrResize); 
                } else if (!e.target.matches('.note-controls, .note-controls *')) {
                    document.addEventListener('mousemove', dragElement); 
                    document.addEventListener('mouseup', stopDragOrResize); 
                }
            }
            
        },
        
    
        addNote: function(note){
            var html, newHtml;
            var colorSelect = '<select class="note-controls-color">';
            
            colors.forEach(function(curr){
                colorSelect += '<option ' + (note.color === curr ? 'selected="selected" ' : '') + 'value="' + curr + '">' + curr + '</option>';
            });
            
            colorSelect += '</select>';
            
            
            html = '<div id="%id%" class="note color-%color%" style="top: %posY%px; left: %posX%px; height: %height%px; width: %width%px;"><div class="note-controls">Color %colorSelect%<button class="note-controls-delete"><i class="fas fa-times"></i> Delete</button><button class="note-controls-edit"><i class="far fa-edit"></i> Edit</button></div><div class="resizer"><i class="fas fa-chevron-circle-right"></i></div><p class="note-text">%text%</p></div>';
            
            newHtml = html.replace('%id%', note.id);
            newHtml = newHtml.replace('%color%', note.color);
            newHtml = newHtml.replace('%posX%', note.posX);
            newHtml = newHtml.replace('%posY%', note.posY);
            newHtml = newHtml.replace('%height%', note.height);
            newHtml = newHtml.replace('%width%', note.width);
            
            newHtml = newHtml.replace('%text%', note.text.replace(/(?:\r\n|\r|\n)/g, '<br>'));
            
            newHtml = newHtml.replace('%colorSelect%', colorSelect);
            
            document.querySelector(DOMstrings.notesContainer).insertAdjacentHTML('beforeend', newHtml);
        },
        
        editMode: function(note){
            var html;
            
            
            var noteUI = document.getElementById(note.id);
            console.log(noteUI);
            var noteText = noteUI.getElementsByClassName(DOMstrings.noteText.replace('.', ''))[0];
            
            html = '<div class="note-editor">Note text<br><textarea class="note-editor-text" rows="6">' + note.text + '</textarea><button class="note-edit-confirm">OK</button><button class="note-edit-cancel">Cancel</button></div>';
            
            noteUI.classList.toggle('editing');
            noteUI.insertAdjacentHTML('beforeend', html);
            noteText.style.display = 'none';
            
        },
        
        exitEditMode: function(id) {
            // remove the form and class that were added in editMode()
            var note = document.getElementById(id);
            var noteText = note.getElementsByClassName(DOMstrings.noteText.replace('.', ''))[0];
            var noteEditor = note.getElementsByClassName(DOMstrings.noteEditor.replace('.', ''))[0];
            note.classList.toggle('editing');
            noteText.style.display = 'block';
            noteEditor.parentNode.removeChild(noteEditor);
        },
        
        // refresh the UI after the text or color has been changed
        updateNote: function(note){
            var noteUI = document.getElementById(note.id);
            var noteText = noteUI.getElementsByClassName(DOMstrings.noteText.replace('.', ''))[0];
            
            //find the old color
            var oldColor = noteUI.className.match(/color-[^\s]+/)[0];
            noteUI.classList.remove(oldColor);
            noteUI.classList.add('color-' + note.color);
          
            noteText.innerHTML = note.text.replace(/(?:\r\n|\r|\n)/g, '<br>');
        },
        
        deleteNote: function(id){
            var noteUI = document.getElementById(id);
            noteUI.parentNode.removeChild(noteUI);
        },
        
        getDOMstrings: function() {
            return DOMstrings;
        }
    };
    
})();


var controller = (function(notesCtrl, UICtrl) {

    var DOM = UICtrl.getDOMstrings();
    
    var setupEventListeners = function() {
        
        // enable dragging and resizing
        document.querySelector(DOM.notesContainer).addEventListener('mousedown', UICtrl.dragOrResize);    
        
        // listen for 'note_changed' custom event; 
        document.querySelector(DOM.notesContainer).addEventListener('note_changed', ctrlUpdateNote);
        
        // edit, delete, confirm edit and cancel edit buttons
        document.querySelector(DOM.notesContainer).addEventListener('click', ctrlNoteBtnClick);
        
        document.querySelector(DOM.notesContainer).addEventListener('change', ctrlNoteChangeColor);
             
        document.querySelector(DOM.addNoteBtn).addEventListener('click', ctrlAddNote);
        
    };
    
    var ctrlNoteChangeColor = function(e) {
        var newColor, note, noteUI;
        if (e.target.classList.contains(DOM.noteControlsColor.replace('.',''))) {
            newColor = e.target.value;            
            note = notesCtrl.getNote(e.target.closest(DOM.note).id);

            note.color = newColor;
            notesCtrl.persistNotes();
            
            UICtrl.updateNote(note);
        }
    };
    
    var ctrlNoteBtnClick = function(e) {
        
        var newText, note;
        
        if (e.target.classList.contains(DOM.noteControlsEditBtn.replace('.',''))) {
            note = notesCtrl.getNote(e.target.closest(DOM.note).id);
            UICtrl.editMode(note);
        } else if (e.target.classList.contains(DOM.noteEditCancel.replace('.',''))) {
            UICtrl.exitEditMode(e.target.closest(DOM.note).id);
        } else if (e.target.classList.contains(DOM.noteEditConfirm.replace('.',''))) {
            note = notesCtrl.getNote(e.target.closest(DOM.note).id);
            newText = e.target.closest(DOM.note).getElementsByClassName(DOM.noteEditorText.replace('.', ''))[0].value;
            note.text = newText;
            
            notesCtrl.persistNotes();
            
            //update the UI
            UICtrl.updateNote(note);
            UICtrl.exitEditMode(e.target.closest(DOM.note).id);
            
        } else if (e.target.classList.contains(DOM.noteControlsDelete.replace('.',''))) {
            //remove from ui
            UICtrl.deleteNote(e.target.closest(DOM.note).id);
            
            notesCtrl.deleteNote(e.target.closest(DOM.note).id);
        }
    };
    
    // called on 'note_changed'
    var ctrlUpdateNote = function(e) {
        var note;
        var noteUI = e.target;
        
        // get UI values
        var noteId = noteUI.id,
            noteHeight = noteUI.offsetHeight,
            noteWidth = noteUI.offsetWidth,
            noteXPos = noteUI.offsetLeft,
            noteYPos = noteUI.offsetTop;
        
        // get the note object from notesCtrl
        note = notesCtrl.getNote(noteId);
        // update the note in the notes controller
        note.height = noteHeight;
        note.width = noteWidth;
        note.posX = noteXPos;
        note.posY = noteYPos;
        
        notesCtrl.persistNotes();
    };
    
    
    // called by a click on the 'New Note' button
    var ctrlAddNote = function() {
        var newNote = notesCtrl.addNote();
        UICtrl.addNote(newNote);
        
        //toggle edit mode on
        UICtrl.editMode(newNote);
    };
    
    var loadNotes = function() {
        var notes;
        // try to load the notes from localstorage
        notesCtrl.loadNotes();
        notes = notesCtrl.getAllNotes();
        
        // add them to the ui
        notes.forEach(function(note){
            UICtrl.addNote(note);
        });
    };
    
    
    return {
        init: function() {            
            setupEventListeners();
            
             //load notes from local storage
            loadNotes();
        }
    };
    
})(notesController, UIController);

controller.init();
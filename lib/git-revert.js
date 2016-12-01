var $ = require('jquery');
var html = $(
'<div class="block text-center">' +
    '<h2>Are you sure you want to revert this file?</h2>' +
    '<p class="git-revert-filename"></p>' +
    '<div class="block git-revert-buttons">' +
        '<button class="inline-block-tight btn btn-lg cancel">Cancel</button>' +
        '<button class="inline-block-tight btn btn-lg btn-error yes icon icon-zap">Revert</button>' +
    '</div>' +
'</div>'
);
var panel;
var editor;
var destroyPanel = function () {
    html.off('click');
    if (panel) {
        panel.destroy();
    }
    if (editor) {
        $(editor.editorElement).removeClass('git-revert-active');
    }
};
var revert = function (path) {
    var useThisRepo = -1,
        repos = atom.project.getRepositories(),
        currentPath,
        justFilePath;

    if (path) {
        //if we supplied a path use it straight up
        currentPath = path;
    } else {
        //else find the editor with focus and use that file
        editor = atom.workspace.getActiveTextEditor();
        currentPath = editor.getPath();
    }
    debugger;

    if (!currentPath) { return; }

    $.each(repos, function (i, _repo) {
        if (!_repo) { // null, non git dir
            return;
        }

        var tpath = _repo.getWorkingDirectory() + '/',
            tfile = currentPath.replace(tpath, '');
        //if this file in git statuses is dirty, this must be our repo
        if (_repo && tfile in _repo.statuses) {
            useThisRepo = i;
        }
    });

    //found no git repos, nothing to do
    if (useThisRepo < 0) { return; }

    var repo = atom.project.getRepositories()[useThisRepo];

    //redoing some computations we just did
    var repoPath = repo.getWorkingDirectory() + '/',
        justFilePath = currentPath.replace(repoPath, '');

    var status = repo.statuses[justFilePath];

    if (!repo) {
        return;
    }

    if (status) {
        if (editor) {
            $(editor.editorElement).addClass('git-revert-active');
        }
        panel = atom.workspace.addModalPanel({
            item: html
        });

        //set filename
        html.find('.git-revert-filename').text(currentPath);

        html.off('click');
        html.on('click', '.btn', function (e) {
            destroyPanel();
            if ($(e.target).hasClass('yes')) {
                //is 0 always good?
                var reverted = repo.checkoutHead(currentPath);
                if (reverted) {
                    atom.notifications.addSuccess('File ' + currentPath + ' reverted!');
                }
            }
        });
    } else {
        atom.notifications.addInfo('File ' + currentPath + ' is in sync with HEAD!');
    }
};

module.exports = {
    activate: function () {
        atom.commands.add('atom-text-editor', 'git-revert:revert', function () {
            revert();
        });
        atom.commands.add('atom-text-editor', 'git-revert:close', function () {
            if (panel) {
                destroyPanel();
            }
        });
        atom.commands.add('.tree-view', 'git-revert:revert', function (event) {
            var path = event.target.getAttribute('data-path');
            revert(path);
        });
    }
};

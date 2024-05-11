import React, { useEffect, useRef, useState } from 'react';
import Editor from './Editor';


const QuillComponent = () => {
    useEffect(() => {

        const bindings = {
            // This will overwrite the default binding also named 'tab'
            tab: {
                key: 9,
                handler: function () {
                    console.log('tab');
                    // Handle tab
                }
            },

            // There is no default binding named 'custom'
            // so this will be added without overwriting anything
            custom: {
                key: ['b', 'B'],
                handler: function (range, context) {
                    // Handle shift+b
                }
            },
            wrapperEnter: {
                key: 'Enter',
                format: ['wrapper'],
                handler: function (range, context) {
                    console.log(context, "context");
                    if (context.format.wrapper) {
                        quill.insertText(range.index, "\n");
                        quill.format("wrapper", false);


                    }
                }

            }

        };


        const quill = new Quill('#editor', {
            theme: 'snow',
            modules: {
                history: {
                    delay: 10,
                    maxStack: 100,
                },
                keyboard: {
                    bindings: bindings
                }
            }
        });


        const Inline = Quill.import('blots/inline');
        const Block = Quill.import('blots/block');
        const BlockEmbed = Quill.import('blots/block/embed');
        var Delta = Quill.import("delta");

        class DivEmbed extends BlockEmbed {
            static blotName = 'divEmbed';
            static tagName = 'div';

            static create(data) {
                console.log(data, "return text");
                let node = super.create();
                // Sanitize url if desired
                node.setAttribute('style', "background:red; width:100px; height:100px");
                node.setAttribute('contenteditable', "true");
                node.setAttribute('id', 'oklah');
                node.setAttribute('data-card', data.card);


                if (data.card) {
                    node.innerHTML = `<div style='background:green' contenteditable='false'>${data.card}</div>`

                }
                // Okay to set other non-format related attributes
                return node;
            }

            static formats(domNode) {
                console.log(domNode, "dom node");
                return {
                    color: domNode.getAttribute("color"),
                    card: domNode.getAttribute("data-card"),
                };
            }
        }

        Quill.register("formats/DivEmbed", DivEmbed);


        class LinkBlot extends Inline {
            static blotName = 'link';
            static tagName = 'a';

            static create(url) {
                let node = super.create();
                // Sanitize url if desired
                node.setAttribute('href', url);
                // Okay to set other non-format related attributes
                return node;
            }

            static formats(node) {
                // We will only be called with a node already
                // determined to be a Link blot, so we do
                // not need to check ourselves
                return node.getAttribute('href');
            }
        }

        class WrapperDiv extends Block {
            static blotName = 'wrapper';
            static tagName = 'div';

            static create(url) {
                let node = super.create();
                // Sanitize url if desired
                node.setAttribute('format', 'WrapperDiv');

                node.setAttribute('style', 'background: purple; width:100px; height:100px;');
                // Okay to set other non-format related attributes
                return node;
            }

            static formats(node) {
                // We will only be called with a node already
                // determined to be a Link blot, so we do
                // not need to check ourselves
                return node.getAttribute('format');
            }
        }

        Quill.register("formats/WrapperDiv", WrapperDiv);

        class HighlightBlot extends Inline {
            static blotName = 'highlight';
            static tagName = 'span';

            static create(value) {
                const node = super.create();
                // Sanitize url value if desired
                node.setAttribute('style', 'color: purple');
                // Okay to set other non-format related attributes
                // These are invisible to Parchment so must be static
                return node;
            }

            static formats(node) {
                // We will only be called with a node already
                // determined to be a Link blot, so we do
                // not need to check ourselves
                return node.getAttribute('href');
            }
        }

        Quill.register(HighlightBlot);

        const onClick = (selector, callback) => {
            document.querySelector(selector).addEventListener('click', callback);
        };

        onClick('#bold-button', () => {
            quill.format('wrapper', true);
        });

        onClick('#italic-button', () => {
            quill.format('divEmbed', { card: 2 });
        });

        onClick('#link-button', () => {
            // const value = prompt('Enter link URL');
            console.log(quill.getSelection(), "quillsj");
            let blot = Quill.find(
                document.getElementById('oklah')
            );
            // document.getElementById(format.id).classList.add("ql-selected");
            let index = blot.offset(quill.scroll);

            console.log(index, 'index');
            quill.updateContents(
                new Delta()
                    .retain(index)
                    .delete(1)
                    .insert({
                        divEmbed: {
                            card: 3

                        }
                    })
            );
        });

    }, [])

    return (
        <div>
            <div id="tooltip-controls">
                <button id="bold-button"><i class="fa fa-bold"></i></button>
                <button id="italic-button"><i class="fa fa-italic"></i></button>
                <button id="link-button"><i class="fa fa-link"></i></button>
                <button id="blockquote-button"><i class="fa fa-quote-right"></i></button>
                <button id="header-1-button"><i class="fa fa-header"><sub>1</sub></i></button>
                <button id="header-2-button"><i class="fa fa-header"><sub>2</sub></i></button>
            </div>
            <div id="editor">
                <h2>Demo Content</h2>
                <p>Preset build with <code>snow</code> theme, and some common formats.</p>
            </div>
        </div>
    )
};

export default QuillComponent;
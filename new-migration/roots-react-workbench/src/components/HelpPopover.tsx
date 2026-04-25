import { X } from 'lucide-react';

import {
  EXPRESSION_SYNTAX_NOTES,
  METHOD_HELP_TOPICS,
} from '../config/methods';
import type { MethodConfig } from '../types/roots';

interface HelpPopoverProps {
  config: MethodConfig;
  onClose: () => void;
}

export function HelpPopover({ config, onClose }: HelpPopoverProps) {
  const help = METHOD_HELP_TOPICS[config.method];

  return (
    <section className="utility-popover help-popover" aria-label={`${config.label} help`}>
      <header className="utility-popover-head">
        <div>
          <p className="section-kicker">Help</p>
          <h2>{config.label}</h2>
        </div>
        <button type="button" className="popover-close-button" onClick={onClose} aria-label="Close help">
          <X aria-hidden="true" />
        </button>
      </header>

      <div className="help-section">
        <h3>Inputs</h3>
        <ul>
          {help.inputExpectations.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      <div className="help-section">
        <h3>Expression syntax</h3>
        <ul>
          {EXPRESSION_SYNTAX_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      <div className="help-section">
        <h3>Stopping</h3>
        <ul>
          {help.stoppingNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

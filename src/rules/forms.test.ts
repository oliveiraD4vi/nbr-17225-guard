import type { Rule } from '@/types'
import { describeRuleScenarios, type RuleScenario } from '../../tests/rules/audit-markup'
import {
  accessibleAuthenticationRule,
  associatedFieldLabelRule,
  contextualHelpRule,
  dataTypeRule,
  fieldLabelRule,
  relatedFieldsRule,
  requiredFieldsRule,
  submitButtonRule,
} from './forms'

const scenarios: Array<[Rule, RuleScenario[]]> = [
  [
    fieldLabelRule,
    [
      {
        name: 'field with a label',
        html: '<label>Nome <input type="text"></label>',
        expected: 'pass',
      },
      {
        name: 'field with only a placeholder',
        html: '<input type="text" placeholder="Nome">',
        expected: 'finding',
      },
    ],
  ],
  [
    associatedFieldLabelRule,
    [
      {
        name: 'label tied to the field',
        html: '<label for="nome">Nome</label><input id="nome" type="text">',
        expected: 'pass',
      },
      {
        name: 'field without a visible label',
        html: '<input type="text" aria-label="Nome">',
        expected: 'pass',
      },
      {
        name: 'visible label not tied to the field',
        html: '<div class="form-field"><span class="form-label">Nome</span><input type="text"></div>',
        expected: 'finding',
      },
    ],
  ],
  [
    relatedFieldsRule,
    [
      {
        name: 'radio buttons in a fieldset',
        html: '<fieldset><legend>Turno</legend><label><input type="radio" name="turno"> Manhã</label><label><input type="radio" name="turno"> Tarde</label></fieldset>',
        expected: 'pass',
      },
      {
        name: 'single checkbox',
        html: '<label><input type="checkbox" name="aceite"> Aceito os termos</label>',
        expected: 'pass',
      },
      {
        name: 'radio buttons without a group',
        html: '<label><input type="radio" name="turno"> Manhã</label><label><input type="radio" name="turno"> Tarde</label>',
        expected: 'finding',
      },
    ],
  ],
  [
    requiredFieldsRule,
    [
      {
        name: 'required field marked in label and markup',
        html: '<label>Nome * <input type="text" required></label>',
        expected: 'pass',
      },
      {
        name: 'required only in the label',
        html: '<label>Nome (obrigatório) <input type="text"></label>',
        expected: 'finding',
      },
    ],
  ],
  [
    dataTypeRule,
    [
      {
        name: 'e-mail field typed as email',
        html: '<label>E-mail <input type="email"></label>',
        expected: 'pass',
      },
      {
        name: 'e-mail field typed as text',
        html: '<label>E-mail <input type="text"></label>',
        expected: 'finding',
      },
    ],
  ],
  [
    contextualHelpRule,
    [
      {
        name: 'password field with format help',
        html: '<label>Senha <input type="password" aria-describedby="dica"></label><p id="dica">Mínimo de 8 caracteres.</p>',
        expected: 'pass',
      },
      {
        name: 'simple text field',
        html: '<label>Nome <input type="text"></label>',
        expected: 'pass',
      },
      {
        name: 'password field without help',
        html: '<label>Senha <input type="password"></label>',
        expected: 'review',
      },
    ],
  ],
  [
    submitButtonRule,
    [
      {
        name: 'form with a submit button',
        html: '<form><label>Nome <input type="text"></label><button type="submit">Enviar</button></form>',
        expected: 'pass',
      },
      {
        // A <button> inside a form submits unless its type says otherwise.
        name: 'form with a button of default type',
        html: '<form><label>Busca <input type="search"></label><button>Pesquisar</button></form>',
        expected: 'pass',
      },
      {
        name: 'form without a way to submit',
        html: '<form><label>Nome <input type="text"></label><button type="button">Limpar</button></form>',
        expected: 'review',
      },
    ],
  ],
  [
    accessibleAuthenticationRule,
    [
      {
        name: 'login without captcha',
        html: '<form><label>Senha <input type="password"></label></form>',
        expected: 'pass',
      },
      {
        name: 'login with a captcha',
        html: '<form><div class="g-recaptcha" data-sitekey="chave"></div></form>',
        expected: 'review',
      },
    ],
  ],
]

describeRuleScenarios(scenarios)

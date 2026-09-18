// Verifiche del confronto tra nomi brand. Si eseguono con: npm run test
import test from 'node:test'
import assert from 'node:assert/strict'
import { gruppiBrandDuplicati, idBrandDuplicati, normalizeBrandKey, sonoBrandSimili, trovaBrandSimili } from './brandNames.js'

test('la chiave ignora maiuscole, spazi, accenti e punteggiatura', () => {
  assert.equal(normalizeBrandKey('Cooler Master'), 'coolermaster')
  assert.equal(normalizeBrandKey('CoolerMaster'), 'coolermaster')
  assert.equal(normalizeBrandKey('Mimì Alla Ferrovia'), 'mimiallaferrovia')
  assert.equal(normalizeBrandKey('NOW Tv'), 'nowtv')
  assert.equal(normalizeBrandKey(''), '')
  assert.equal(normalizeBrandKey(null), '')
})

test('riconosce i nomi scritti in modo diverso', () => {
  assert.ok(sonoBrandSimili('Nerd Show', 'NerdShow'))
  assert.ok(sonoBrandSimili('San Carlo', 'san carlo'))
  assert.ok(sonoBrandSimili('Smesh Burgers', 'Smeshburger'))
  assert.ok(sonoBrandSimili('Che Macello Hamburgheria', 'Chemacello Hamburgheria'))
})

test('non segnala brand diversi', () => {
  assert.equal(sonoBrandSimili('Logitech', 'Mattel'), false)
  assert.equal(sonoBrandSimili('Sony Music', 'Sony Pictures'), false)
  assert.equal(sonoBrandSimili('', 'Qualcosa'), false)
  assert.equal(sonoBrandSimili('Nike', 'Mike'), false)
})

test('trova i simili escludendo il record che si sta modificando', () => {
  const brands = [
    { id: 1, nome: 'Cooler Master' },
    { id: 2, nome: 'Logitech' },
  ]
  assert.equal(trovaBrandSimili('coolermaster', brands).length, 1)
  assert.equal(trovaBrandSimili('Cooler Master', brands, 1).length, 0)
  assert.equal(trovaBrandSimili('Nuovo Brand', brands).length, 0)
})

test('gruppi e id dei possibili duplicati', () => {
  const brands = [
    { id: 1, nome: 'Comofun' },
    { id: 2, nome: 'COMOFUN' },
    { id: 3, nome: 'Altro' },
  ]
  const gruppi = gruppiBrandDuplicati(brands)
  assert.equal(gruppi.length, 1)
  assert.equal(gruppi[0].length, 2)
  const ids = idBrandDuplicati(brands)
  assert.ok(ids.has(1) && ids.has(2))
  assert.equal(ids.has(3), false)
})
